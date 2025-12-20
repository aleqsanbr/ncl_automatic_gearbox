import { fuzzify } from './sets.js';
import { getRules } from './rules.js';

export const fuzzyInference = (inputs, mode, currentGear) => {
  const fuzzyInputs = fuzzify(inputs, mode);
  const rules = getRules(mode);
  const memberships = {};
  const activatedRules = [];

  for (const rule of rules) {
    let strength = 1;

    for (const condition of rule.conditions) {
      const [param, set] = condition.split('.');
      const value = fuzzyInputs[param][set];
      strength = Math.min(strength, value);
    }

    if (strength > 0.01) {
      // Учитываем приоритет правила как множитель (нормализуем к [0,1])
      const priorityFactor = Math.max(0, Math.min(1, (rule.priority || 50) / 100));
      const weightedStrength = strength * priorityFactor;

      let targetGear = rule.gear;

      // Специальные маркеры
      if (targetGear === 'upshift') {
        targetGear = Math.min(7, currentGear + 1);
      } else if (targetGear === 'downshift') {
        targetGear = Math.max(0, currentGear - 1);
      } else if (targetGear === -1) {
        // -1 означает "держать текущую"
        targetGear = currentGear;
      }

      // Нормализуем к числу (в правилах иногда числа, иногда спец. метки)
      targetGear = parseInt(targetGear, 10);

      if (Number.isNaN(targetGear)) continue;

      if (!memberships[targetGear]) {
        memberships[targetGear] = 0;
      }

      // Берём максимум от уже существующего и нового взвешенного значения
      memberships[targetGear] = Math.max(memberships[targetGear], weightedStrength);

      activatedRules.push({
        gear: targetGear,
        strength: weightedStrength,
        priority: rule.priority,
        conditions: rule.conditions
      });
    }
  }

  return { memberships, activatedRules, fuzzyInputs };
};

export const defuzzify = (memberships, currentGear) => {
  // Если нет кандидатов — остаёмся на текущей передаче
  const gearsAll = Object.keys(memberships)
    .map((g) => parseInt(g, 10))
    .filter((g) => !Number.isNaN(g));
  if (gearsAll.length === 0) return currentGear;

  // Выбираем передачу с максимальной membership (winner-takes-all).
  // Если несколько с одинаковой силой — выбираем ближе к текущей (и в случае равенства — более высокую передачу).
  let maxVal = -Infinity;
  let candidates = [];
  for (const g of gearsAll) {
    const v = memberships[g] || 0;
    if (v > maxVal + 1e-9) {
      maxVal = v;
      candidates = [g];
    } else if (Math.abs(v - maxVal) <= 1e-9) {
      candidates.push(g);
    }
  }

  candidates.sort((a, b) => {
    const da = Math.abs(a - currentGear);
    const db = Math.abs(b - currentGear);
    if (da !== db) return da - db; // ближе к текущей раньше
    return b - a; // при равной дистанции предпочитаем большую передачу
  });

  let chosen = candidates[0];

  // Ограничение: не более чем на 1 передачу за раз
  const allowedMin = Math.max(0, currentGear - 1);
  const allowedMax = Math.min(7, currentGear + 1);
  if (chosen < allowedMin) chosen = allowedMin;
  if (chosen > allowedMax) chosen = allowedMax;

  return Math.max(0, Math.min(7, parseInt(chosen, 10)));
};

export class FuzzyGearbox {
  constructor() {
    this.currentGear = 0;
    this.mode = 'D';
    this.lastRecommended = 0;
    this.sameCounter = 0;
    this.lastShiftTime = -1000; // секунды симуляции
    this.minShiftInterval = 0.5; // минимальный интервал между переключениями (в секундах)
  }

  getRecommendedGear(inputs, currentTime = 0) {
    // ЖЕСТКОЕ ПРАВИЛО: если машина стоит, ВСЕГДА нейтраль
    if (inputs.speed < 0.5 && inputs.throttle < 5) {
      if (this.currentGear !== 0) {
        this.sameCounter = 0;
        this.lastRecommended = 0;
      }
      this.currentGear = 0;
      return { currentGear: 0, recommended: 0, inference: null };
    }

    if (this.currentGear === 0 && inputs.throttle > 10) {
      this.sameCounter = 20;
      this.lastRecommended = 1;
      this.currentGear = 1;
      this.lastShiftTime = currentTime;
      return { currentGear: 1, recommended: 1, inference: null };
    }

    const inference = fuzzyInference(inputs, this.mode, this.currentGear);
    let recommended = defuzzify(inference.memberships, this.currentGear);

    // Во время торможения или наката запрещаем upshift
    if (inputs.throttle < 5 && recommended > this.currentGear) {
      recommended = this.currentGear;
    }

    // Во время торможения запрещаем подъём на следующую передачу
    if (inputs.brake > 20 && recommended > this.currentGear) {
      recommended = this.currentGear;
    }

    // ГИСТЕРЕЗИС: порог в "кадрах" до применения
    let threshold = 30;
    if (inputs.brake > 60) {
      // при сильном торможении хотим быстрый downshift — меньший порог
      threshold = 10;
    } else if (recommended < this.currentGear) {
      // downshift обычно чуть быстрее
      threshold = 18;
    } else {
      // upshift требует больше уверенности, чтобы избежать дёрганий
      threshold = 30;
    }

    // Минимальное время между переключениями (устраняет дребезг)
    const timeSinceLastShift = currentTime - (this.lastShiftTime || 0);
    const canShiftByTime = timeSinceLastShift >= this.minShiftInterval;

    if (recommended === this.lastRecommended) {
      this.sameCounter++;
    } else {
      this.lastRecommended = recommended;
      this.sameCounter = 0;
    }

    // Решение о переключении: требуется и достаточное количество "кадров" и таймаут прошёл
    if (recommended !== this.currentGear && this.sameCounter >= threshold && canShiftByTime) {
      this.currentGear = recommended;
      this.sameCounter = 0;
      this.lastShiftTime = currentTime;
    }

    return { currentGear: this.currentGear, recommended, inference };
  }

  setMode(mode) {
    this.mode = mode;
    this.sameCounter = 0;
    if (mode === 'S' && this.currentGear > 6) {
      this.currentGear = 6;
    }
  }
}

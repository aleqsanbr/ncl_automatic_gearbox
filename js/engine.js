import { fuzzify } from './sets.js';
import { getRules } from './rules.js';

export const fuzzyInference = (inputs, mode, currentGear) => {
  const fuzzyInputs = fuzzify(inputs, mode);
  const rules = getRules(mode);
  const memberships = {}; // степени принадлежности к каждой передаче
  const activatedRules = [];

  for (const rule of rules) {
    let strength = 1;

    for (const condition of rule.conditions) {
      const [param, set] = condition.split('.');
      const value = fuzzyInputs[param][set];
      strength = Math.min(strength, value);
    }

    if (strength <= 0.01) continue;

    const priorityFactor = Math.max(0, Math.min(1, (rule.priority || 50) / 100)); // нормализация к [0,1]
    const weightedStrength = strength * priorityFactor;

    let targetGear = rule.gear;

    // Специальные маркеры
    if (targetGear === 'upshift') {
      targetGear = Math.min(7, currentGear + 1);
    } else if (targetGear === 'downshift') {
      targetGear = Math.max(0, currentGear - 1);
    } else if (targetGear === -1) {
      targetGear = currentGear; // -1 означает "держать текущую"
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

  return { memberships, activatedRules, fuzzyInputs };
};

// memberships - {5: 0.33, 6: 0.56, 7: 0.23}

export const defuzzify = (memberships, currentGear) => {
  // Если нет кандидатов — остаёмся на текущей передаче
  const gearsAll = Object.keys(memberships).map((g) => parseInt(g, 10)).filter((g) => !Number.isNaN(g));

  if (gearsAll.length === 0) return currentGear;

  // Центроидный метод: взвешенное среднее
  // x₀ = Σ(xᵢ · μ(xᵢ)) / Σμ(xᵢ)
  let sumWeighted = 0;
  let sumMembership = 0;

  for (const g of gearsAll) {
    const mu = memberships[g] || 0;
    sumWeighted += g * mu;
    sumMembership += mu;
  }

  const centroid = sumMembership > 0 ? sumWeighted / sumMembership : currentGear;

  // Округляем до ближайшей передачи
  let chosen = Math.round(centroid);

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

    // ГИСТЕРЕЗИС
    let threshold = 30;
    if (inputs.brake > 60) {
      threshold = 10;
    } else if (recommended < this.currentGear) {
      threshold = 18;
    } else {
      threshold = 30;
    }

    // Минимальное время между переключениями
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

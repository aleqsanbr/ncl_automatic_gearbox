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
      let targetGear = rule.gear;

      if (targetGear === 'upshift') {
        targetGear = mode === 'S' ? Math.min(6, currentGear + 1) : Math.min(7, currentGear + 1);
      } else if (targetGear === 'downshift') {
        targetGear = Math.max(0, currentGear - 1);
      }

      if (!memberships[targetGear]) {
        memberships[targetGear] = 0;
      }

      memberships[targetGear] = Math.max(memberships[targetGear], strength);
      activatedRules.push({
        gear: targetGear,
        strength,
        priority: rule.priority,
        conditions: rule.conditions
      });
    }
  }

  return { memberships, activatedRules, fuzzyInputs };
};

export const defuzzify = (memberships, currentGear) => {
  const gears = Object.keys(memberships).map((g) => parseInt(g));

  if (gears.length === 0) return currentGear;

  let numerator = 0;
  let denominator = 0;

  for (const gear of gears) {
    const membership = memberships[gear];
    numerator += gear * membership;
    denominator += membership;
  }

  if (denominator === 0) return currentGear;

  const result = numerator / denominator;
  const rounded = Math.round(result);

  return Math.max(0, Math.min(7, rounded));
};

export class FuzzyGearbox {
  constructor() {
    this.currentGear = 0;
    this.mode = 'D';
    this.lastRecommended = 0;
    this.sameCounter = 0;
    this.lastShiftTime = 0;
    this.engineStarted = false; // Флаг для отслеживания, включена ли машина
  }

  getRecommendedGear(inputs, currentTime = 0) {
    // ЖЕСТКОЕ ПРАВИЛО: если машина стоит, ВСЕГДА нейтраль
    // Это не fuzzy, но необходимо для правильного поведения при старте
    if (inputs.speed < 0.5 && inputs.throttle < 5) {
      // Машина стоит и нет газа
      if (this.currentGear !== 0) {
        this.sameCounter = 0;
        this.lastRecommended = 0;
      }
      this.currentGear = 0;
      this.engineStarted = false;
      return { currentGear: 0, recommended: 0, inference: null };
    }

    // Если включили газ на нейтрали, переходим на 1-ю
    if (this.currentGear === 0 && inputs.throttle > 10) {
      this.engineStarted = true;
      this.sameCounter = 20; // Сразу даём разрешение
      this.lastRecommended = 1;
      this.currentGear = 1;
      return { currentGear: 1, recommended: 1, inference: null };
    }

    // Нормальная fuzzy логика если уже едим
    const inference = fuzzyInference(inputs, this.mode, this.currentGear);
    let recommended = defuzzify(inference.memberships, this.currentGear);

    if (this.mode === 'S') {
      recommended = Math.min(recommended, 6);
    }

    // ГИСТЕРЕЗИС
    let threshold = 20;
    if (inputs.brake > 40) {
      threshold = 8;
    } else if (recommended < this.currentGear) {
      threshold = 12;
    } else {
      threshold = 18;
    }

    if (recommended === this.lastRecommended) {
      this.sameCounter++;
    } else {
      this.lastRecommended = recommended;
      this.sameCounter = 0;
    }

    if (recommended !== this.currentGear && this.sameCounter >= threshold) {
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

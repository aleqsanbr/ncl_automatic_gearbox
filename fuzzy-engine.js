import { fuzzify } from './fuzzy-sets.js';
import { getRules } from './fuzzy-rules.js';

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
        targetGear = Math.min(7, currentGear + 1);
      } else if (targetGear === 'downshift') {
        targetGear = Math.max(1, currentGear - 1);
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

  return Math.max(1, Math.min(7, rounded));
};

export class FuzzyGearbox {
  constructor() {
    this.currentGear = 1;
    this.mode = 'D';
    this.lastSwitch = Date.now();
    this.switchDelay = 300; // Уменьшено для более отзывчивых переключений
    this.lastRecommended = 1;
    this.recommendedCounter = 0;
  }

  getRecommendedGear(inputs) {
    const inference = fuzzyInference(inputs, this.mode, this.currentGear);
    let recommended = defuzzify(inference.memberships, this.currentGear);

    // КРИТИЧНО: При сильном торможении - ФОРСИРОВАННЫЙ downshift
    if (inputs.brake > 70) {
      // Рассчитываем оптимальную передачу для текущей скорости при торможении
      let targetGear;
      if (inputs.speed < 15) targetGear = 1;
      else if (inputs.speed < 30) targetGear = 2;
      else if (inputs.speed < 50) targetGear = 3;
      else if (inputs.speed < 80) targetGear = 4;
      else targetGear = 5;

      if (targetGear < this.currentGear) {
        this.currentGear = targetGear;
        this.lastRecommended = targetGear;
        this.recommendedCounter = 0;
        this.lastSwitch = Date.now();
        return {
          currentGear: this.currentGear,
          recommended: targetGear,
          inference
        };
      }
    }

    // В Sport режиме НИКОГДА не используем 7 передачу на скорости <200
    if (this.mode === 'S' && inputs.speed < 200) {
      recommended = Math.min(recommended, 6);
    }

    // В Sport режиме на высоких скоростях держим 5-6 передачу
    if (this.mode === 'S' && inputs.speed > 150 && this.currentGear >= 6) {
      recommended = Math.min(recommended, 6);
    }

    if (recommended === this.lastRecommended) {
      this.recommendedCounter++;
    } else {
      this.lastRecommended = recommended;
      this.recommendedCounter = 0;
    }

    const now = Date.now();
    const timeSinceLastSwitch = now - this.lastSwitch;

    const shouldSwitch = recommended !== this.currentGear && timeSinceLastSwitch >= this.switchDelay && this.recommendedCounter >= 2;

    if (shouldSwitch) {
      this.currentGear = recommended;
      this.lastSwitch = now;
      this.recommendedCounter = 0;
    }

    return {
      currentGear: this.currentGear,
      recommended,
      inference
    };
  }

  setMode(mode) {
    this.mode = mode;
    this.recommendedCounter = 0;
    this.lastSwitch = 0;
  }
}

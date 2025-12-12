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
    this.switchDelay = 300;
  }

  getRecommendedGear(inputs) {
    const inference = fuzzyInference(inputs, this.mode, this.currentGear);
    const recommended = defuzzify(inference.memberships, this.currentGear);

    const now = Date.now();
    if (recommended !== this.currentGear && now - this.lastSwitch >= this.switchDelay) {
      this.currentGear = recommended;
      this.lastSwitch = now;
    }

    return {
      currentGear: this.currentGear,
      recommended,
      inference
    };
  }

  setMode(mode) {
    this.mode = mode;
  }
}

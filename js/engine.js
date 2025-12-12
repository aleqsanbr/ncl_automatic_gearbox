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
    this.lastRecommended = 1;
    this.sameCounter = 0;
  }

  getRecommendedGear(inputs) {
    const inference = fuzzyInference(inputs, this.mode, this.currentGear);
    let recommended = defuzzify(inference.memberships, this.currentGear);

    const gearSpeeds = [
      { min: 0, max: 60 },
      { min: 10, max: 100 },
      { min: 30, max: 140 },
      { min: 50, max: 170 },
      { min: 70, max: 190 },
      { min: 90, max: 210 },
      { min: 110, max: 240 }
    ];

    if (this.mode === 'S') {
      recommended = Math.min(recommended, 6);
    }

    if (inputs.brake > 80) {
      if (inputs.speed < 20) recommended = Math.min(recommended, 1);
      else if (inputs.speed < 40) recommended = Math.min(recommended, 2);
      else if (inputs.speed < 70) recommended = Math.min(recommended, 3);
      else if (inputs.speed < 100) recommended = Math.min(recommended, 4);
      else if (inputs.speed < 140) recommended = Math.min(recommended, 5);
    }

    if (inputs.brake > 0 && recommended > this.currentGear) {
      recommended = this.currentGear;
    }

    if (recommended === this.lastRecommended) {
      this.sameCounter++;
    } else {
      this.lastRecommended = recommended;
      this.sameCounter = 0;
    }

    // Для downshift нужно меньше подтверждений (быстрее реакция)
    const threshold = recommended < this.currentGear ? 3 : 5;

    if (recommended !== this.currentGear && this.sameCounter >= threshold) {
      this.currentGear = recommended;
      this.sameCounter = 0;
    }

    return {
      currentGear: this.currentGear,
      recommended,
      inference
    };
  }

  setMode(mode) {
    this.mode = mode;
    this.sameCounter = 0;

    if (mode === 'S' && this.currentGear > 6) {
      this.currentGear = 6;
    }
  }
}

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
  }

  getRecommendedGear(inputs, currentTime = 0) {
    if (inputs.throttle < 5 && this.currentGear > 1) {
      if (inputs.speed < 10 && this.currentGear > 1) {
        this.currentGear = 1;
        this.sameCounter = 0;
        this.lastShiftTime = currentTime;
      } else if (inputs.speed < 22 && this.currentGear > 2) {
        this.currentGear = 2;
        this.sameCounter = 0;
        this.lastShiftTime = currentTime;
      } else if (inputs.speed < 35 && this.currentGear > 3) {
        this.currentGear = 3;
        this.sameCounter = 0;
        this.lastShiftTime = currentTime;
      } else if (inputs.speed < 48 && this.currentGear > 4) {
        this.currentGear = 4;
        this.sameCounter = 0;
        this.lastShiftTime = currentTime;
      }
    }

    const inference = fuzzyInference(inputs, this.mode, this.currentGear);
    let recommended = defuzzify(inference.memberships, this.currentGear);

    if (this.mode === 'S') {
      recommended = Math.min(recommended, 6);
    }

    if (Math.abs(recommended - this.currentGear) > 1) {
      if (recommended > this.currentGear) {
        recommended = this.currentGear + 1;
      } else {
        recommended = this.currentGear - 1;
      }
    }

    const timeSinceLastShift = currentTime - this.lastShiftTime;
    const minShiftInterval = 0.8;

    if (timeSinceLastShift < minShiftInterval && recommended !== this.currentGear && this.currentGear !== 0) {
      recommended = this.currentGear;
    }

    if (inputs.brake > 80) {
      if (inputs.speed < 5) recommended = 0;
      else if (inputs.speed < 20) recommended = Math.min(recommended, 1);
      else if (inputs.speed < 40) recommended = Math.min(recommended, 2);
      else if (inputs.speed < 70) recommended = Math.min(recommended, 3);
      else if (inputs.speed < 100) recommended = Math.min(recommended, 4);
      else if (inputs.speed < 140) recommended = Math.min(recommended, 5);
    }

    if (inputs.brake > 0 && recommended > this.currentGear) {
      recommended = this.currentGear;
    }

    if (inputs.speed < 1 && inputs.throttle < 5) {
      recommended = 0;
    }

    if (recommended === this.lastRecommended) {
      this.sameCounter++;
    } else {
      this.lastRecommended = recommended;
      this.sameCounter = 0;
    }

    const thresholdDown = 10;
    const thresholdUp = 15;
    const threshold = recommended < this.currentGear ? thresholdDown : thresholdUp;

    if (recommended !== this.currentGear && this.sameCounter >= threshold) {
      this.currentGear = recommended;
      this.sameCounter = 0;
      this.lastShiftTime = currentTime;
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

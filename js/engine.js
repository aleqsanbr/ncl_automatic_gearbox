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
    this.lastShiftTime = 0;
  }

  getRecommendedGear(inputs, currentTime = 0) {
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

    if (timeSinceLastShift < minShiftInterval && recommended !== this.currentGear) {
      recommended = this.currentGear;
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

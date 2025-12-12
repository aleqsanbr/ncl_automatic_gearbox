import { FuzzyGearbox } from './fuzzy-engine.js';

export class CarSimulator {
  constructor() {
    this.speed = 0;
    this.rpm = 900;
    this.throttle = 0;
    this.brake = 0;

    this.fuzzy = new FuzzyGearbox();
  }

  getGearRatios() {
    return [3.5, 2.1, 1.4, 1.0, 0.8, 0.65, 0.55];
  }

  getGearSpeeds() {
    return [
      { min: 0, max: 60 },
      { min: 10, max: 100 },
      { min: 30, max: 140 },
      { min: 50, max: 170 },
      { min: 70, max: 190 },
      { min: 90, max: 210 },
      { min: 110, max: 240 }
    ];
  }

  getBaseRPM() {
    if (this.fuzzy.mode === 'D') {
      return [900, 1200, 1600, 2000, 2200, 2200, 2000];
    } else {
      return [1500, 2000, 2500, 3000, 3500, 4000, 4500];
    }
  }

  getMaxRPM() {
    if (this.fuzzy.mode === 'D') {
      return [3500, 3800, 3800, 3800, 3500, 3200, 3000];
    } else {
      return [5500, 5500, 5500, 5500, 5500, 5500, 6000];
    }
  }

  calculateRPMForSpeed(speed, gear) {
    if (speed < 1) return this.getBaseRPM()[gear - 1];

    const gearSpeeds = this.getGearSpeeds()[gear - 1];
    const baseRPM = this.getBaseRPM()[gear - 1];
    const maxRPM = this.getMaxRPM()[gear - 1];

    const ratio = Math.min(1, Math.max(0, (speed - gearSpeeds.min) / (gearSpeeds.max - gearSpeeds.min)));

    return baseRPM + (maxRPM - baseRPM) * ratio;
  }

  update(deltaTime) {
    const dt = deltaTime / 1000;

    if (this.throttle > 0 && this.brake > 0) {
      if (this.throttle > this.brake) {
        this.brake = 0;
      } else {
        this.throttle = 0;
      }
    }

    const mass = 1200;
    const powerFactor = 85;
    const rollingResistance = 30;
    const airResistanceCoeff = 0.3;

    const gear = this.fuzzy.currentGear;
    const gearRatio = this.getGearRatios()[gear - 1];
    const gearEfficiency = 1.0 / gearRatio;

    const throttleForce = this.throttle * powerFactor * gearEfficiency;
    const airResistance = airResistanceCoeff * this.speed * this.speed;
    const brakeForce = this.brake * 80;

    const engineBrakingFactor = this.throttle === 0 ? gearRatio * 100 : 0;

    const netForce = throttleForce - airResistance - rollingResistance - brakeForce - engineBrakingFactor;
    const acceleration = netForce / mass;

    this.speed += acceleration * dt * 3.6;
    this.speed = Math.max(0, Math.min(240, this.speed));

    const inputs = {
      speed: this.speed,
      rpm: this.rpm,
      brake: this.brake,
      throttle: this.throttle
    };

    const result = this.fuzzy.getRecommendedGear(inputs);

    const targetRPM = this.calculateRPMForSpeed(this.speed, gear);
    this.rpm += (targetRPM - this.rpm) * dt * 5;
    this.rpm = Math.max(800, Math.min(6500, this.rpm));

    return result;
  }

  setMode(mode) {
    this.fuzzy.setMode(mode);
    this.rpm = this.calculateRPMForSpeed(this.speed, this.fuzzy.currentGear);
  }

  setThrottle(value) {
    this.throttle = Math.max(0, Math.min(100, value));
    if (this.throttle > 0 && this.brake > 0) {
      this.brake = 0;
    }
  }

  setBrake(value) {
    this.brake = Math.max(0, Math.min(100, value));
    if (this.brake > 0 && this.throttle > 0) {
      this.throttle = 0;
    }
  }
}

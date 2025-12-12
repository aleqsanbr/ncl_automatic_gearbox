import { FuzzyGearbox } from './fuzzy-engine.js';

export class CarSimulator {
  constructor() {
    this.speed = 0;
    this.rpm = 900;
    this.throttle = 0;
    this.brake = 0;

    this.fuzzy = new FuzzyGearbox();
    this.isShifting = false;
    this.shiftTime = 0;
  }

  getBaseRPM() {
    if (this.fuzzy.mode === 'D') {
      return [900, 1100, 1300, 1400, 1400, 1400, 1300];
    } else {
      return [2000, 2500, 3500, 3500, 3500, 3500, 3500];
    }
  }

  getShiftRPM() {
    if (this.fuzzy.mode === 'D') {
      return [1800, 1800, 1700, 1600, 1500, 1400, 5500];
    } else {
      return [4000, 4200, 4200, 4200, 4200, 4200, 5500];
    }
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

    const acceleration = this.throttle * 0.008;
    const brakeForce = this.brake * 0.05;

    const airResistance = this.speed * 0.0003;
    const engineBraking = this.throttle === 0 ? 0.08 : 0;

    this.speed += acceleration * dt * 60;
    this.speed -= brakeForce * dt * 60;
    this.speed -= airResistance * dt * 60;
    this.speed -= engineBraking * dt * 60;

    this.speed = Math.max(0, Math.min(220, this.speed));

    const inputs = {
      speed: this.speed,
      rpm: this.rpm,
      brake: this.brake
    };

    const result = this.fuzzy.getRecommendedGear(inputs);

    if (result.currentGear !== result.recommended && !this.isShifting) {
      this.isShifting = true;
      this.shiftTime = 0;
    }

    if (this.isShifting) {
      this.shiftTime += dt;
      if (this.shiftTime >= 0.3) {
        this.isShifting = false;
        this.shiftTime = 0;
        const baseRPMs = this.getBaseRPM();
        this.rpm = baseRPMs[this.fuzzy.currentGear - 1];
      } else {
        this.rpm *= 0.92;
      }
      return result;
    }

    const gear = this.fuzzy.currentGear;
    const baseRPMs = this.getBaseRPM();
    const shiftRPMs = this.getShiftRPM();
    const baseRPM = baseRPMs[gear - 1];
    const shiftRPM = shiftRPMs[gear - 1];

    if (this.speed < 1) {
      this.rpm += (baseRPM - this.rpm) * dt * 3;
      return result;
    }

    const speedRatio = Math.min(1, this.speed / (gear * 30));
    const targetRPM = baseRPM + (shiftRPM - baseRPM) * speedRatio;

    if (this.brake > 30) {
      this.rpm += (targetRPM * 0.7 - this.rpm) * dt * 4;
    } else {
      this.rpm += (targetRPM - this.rpm) * dt * 2;
    }

    this.rpm = Math.max(800, Math.min(6500, this.rpm));

    return result;
  }

  setMode(mode) {
    this.fuzzy.setMode(mode);
    const baseRPMs = this.getBaseRPM();
    this.rpm = baseRPMs[this.fuzzy.currentGear - 1];
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

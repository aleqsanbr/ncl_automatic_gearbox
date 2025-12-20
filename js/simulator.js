import { FuzzyGearbox } from './engine.js';

export class CarSimulator {
  constructor() {
    this.speed = 0;
    this.rpm = 900;
    this.throttle = 0;
    this.brake = 0;

    this.fuzzy = new FuzzyGearbox();
    this.isShifting = false;
    this.shiftTimer = 0;
    this.totalTime = 0;
  }

  getGearRatios() {
    return [0, 3.5, 2.1, 1.4, 1.0, 0.8, 0.65, 0.55];
  }

  getIdleRPM() {
    return this.fuzzy.mode === 'D' ? 900 : 1000;
  }

  getTargetRPMFromThrottle(throttle) {
    const idleRPM = this.getIdleRPM();
    const maxRPM = this.fuzzy.mode === 'D' ? 4500 : 6500;

    if (throttle < 5) {
      return idleRPM;
    }

    return idleRPM + (maxRPM - idleRPM) * (throttle / 100);
  }

  calculateSpeedFromRPM(rpm, gear) {
    if (gear === 0) return this.speed;

    const gearRatio = this.getGearRatios()[gear];
    const wheelCircumference = 2.0;
    const finalDriveRatio = 3.9;

    const wheelRPM = rpm / (gearRatio * finalDriveRatio);
    const speedMetersPerMinute = wheelRPM * wheelCircumference;
    const speedKmH = (speedMetersPerMinute * 60) / 1000;

    return speedKmH;
  }

  calculateRPMFromSpeed(speed, gear) {
    if (gear === 0) return this.getIdleRPM();
    if (speed < 0.1) return this.getIdleRPM();

    const gearRatio = this.getGearRatios()[gear];
    const wheelCircumference = 2.0;
    const finalDriveRatio = 3.9;

    const speedMetersPerMinute = (speed * 1000) / 60;
    const wheelRPM = speedMetersPerMinute / wheelCircumference;
    const rpm = wheelRPM * gearRatio * finalDriveRatio;

    return Math.max(this.getIdleRPM(), rpm);
  }

  update(deltaTime) {
    const dt = deltaTime / 1000;
    this.totalTime += dt;

    const inputs = {
      speed: this.speed,
      rpm: this.rpm,
      brake: this.brake,
      throttle: this.throttle
    };

    const previousGear = this.fuzzy.currentGear;
    const result = this.fuzzy.getRecommendedGear(inputs, this.totalTime);
    const gear = this.fuzzy.currentGear;

    if (previousGear !== gear && !this.isShifting) {
      this.isShifting = true;
      this.shiftTimer = 0.05;
    }

    if (this.isShifting) {
      this.shiftTimer -= dt;
      if (this.shiftTimer <= 0) {
        this.isShifting = false;
      }
    }

    if (this.brake > 0) {
      const maxBrakeDeceleration = 35;
      const brakeDeceleration = (this.brake / 100) * maxBrakeDeceleration;
      this.speed -= brakeDeceleration * dt;
      this.speed = Math.max(0, this.speed);

      if (gear > 0) {
        const targetRPM = this.calculateRPMFromSpeed(this.speed, gear);
        // На низких передачах (1-2) сильно уменьшаем скорость изменения RPM для плавности
        // На высоких передачах можно быстрее
        const baseDelta = gear <= 2 ? 400 : gear <= 4 ? 800 : 1200;
        const maxDeltaRPMPerSec = baseDelta;
        const maxDelta = maxDeltaRPMPerSec * dt;
        const delta = targetRPM - this.rpm;
        const limitedDelta = Math.max(-maxDelta, Math.min(maxDelta, delta));
        this.rpm += limitedDelta;
      } else {
        const targetIdleRPM = this.getIdleRPM();
        const maxDeltaRPMPerSec = 800;
        const maxDelta = maxDeltaRPMPerSec * dt;
        const delta = targetIdleRPM - this.rpm;
        const limitedDelta = Math.max(-maxDelta, Math.min(maxDelta, delta));
        this.rpm += limitedDelta;
      }
    } else if (gear === 0) {
      const targetRPM = this.getTargetRPMFromThrottle(this.throttle);
      const maxDeltaRPMPerSec = 800;
      const maxDelta = maxDeltaRPMPerSec * dt;
      const delta = targetRPM - this.rpm;
      const appliedDelta = Math.max(-maxDelta, Math.min(maxDelta, delta));
      this.rpm += appliedDelta;

      const rollingResistance = 60;
      const airResistance = 0.4 * this.speed * this.speed;
      const deceleration = (rollingResistance + airResistance) / 1200;
      this.speed -= deceleration * dt * 3.6;
      this.speed = Math.max(0, this.speed);
    } else {
      // RPM определяется скоростью и передачей через механическую связь
      const baseRPM = this.calculateRPMFromSpeed(this.speed, gear);

      if (this.throttle > 5) {
        // При нажатом газе стремимся к более высоким оборотам
        const maxRPM = this.fuzzy.mode === 'D' ? 4500 : 6500;
        const throttleRPM = this.getIdleRPM() + (maxRPM - this.getIdleRPM()) * (this.throttle / 100);
        const targetRPM = Math.max(baseRPM, throttleRPM);

        const maxDeltaRPMPerSec = 1500;
        const maxDelta = maxDeltaRPMPerSec * dt;
        const delta = targetRPM - this.rpm;
        const appliedDelta = Math.max(-maxDelta, Math.min(maxDelta, delta));
        this.rpm += appliedDelta;
      } else {
        // Без газа RPM плавно следует за baseRPM (но быстрее чем с газом)
        const maxDeltaRPMPerSec = 2500;
        const maxDelta = maxDeltaRPMPerSec * dt;
        const delta = baseRPM - this.rpm;
        const appliedDelta = Math.max(-maxDelta, Math.min(maxDelta, delta));
        this.rpm += appliedDelta;
      }

      const theoreticalSpeed = this.calculateSpeedFromRPM(this.rpm, gear);

      const mass = 1800;
      const rollingResistance = 30;
      const airResistance = 0.22 * this.speed * this.speed;

      const gearRatio = this.getGearRatios()[gear];
      const engineBrakingBase = this.throttle === 0 ? gearRatio * 1200 : 0;
      const speedFactor = Math.min(1, this.speed / 30);
      const engineBraking = engineBrakingBase * speedFactor;

      let acceleration = 0;

      if (gear > 0 && theoreticalSpeed > this.speed + 0.5) {
        const rpmAboveIdle = Math.max(0, this.rpm - this.getIdleRPM());
        const throttleFactor = this.throttle / 100;
        const engineForce = rpmAboveIdle * gearRatio * 3.5 * throttleFactor;

        const netForce = engineForce - rollingResistance - airResistance - engineBraking;
        acceleration = netForce / mass;
      } else {
        const deceleration = (rollingResistance + airResistance + engineBraking) / mass;
        acceleration = -deceleration;
      }

      this.speed += acceleration * dt * 3.6;
      this.speed = Math.max(0, Math.min(240, this.speed));
    }

    this.rpm = Math.max(800, Math.min(6500, this.rpm));

    return result;
  }

  setMode(mode) {
    this.fuzzy.setMode(mode);
    if (this.fuzzy.currentGear > 0) {
      this.rpm = this.calculateRPMFromSpeed(this.speed, this.fuzzy.currentGear);
    } else {
      this.rpm = this.getIdleRPM();
    }
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

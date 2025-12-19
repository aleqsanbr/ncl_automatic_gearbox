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
    const maxRPM = this.fuzzy.mode === 'D' ? 4000 : 6500;

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

    if (this.throttle > 0 && this.brake > 0) {
      if (this.throttle > this.brake) {
        this.brake = 0;
      } else {
        this.throttle = 0;
      }
    }

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

      if (gear > 0) {
        const targetRPMForGear = this.calculateRPMFromSpeed(this.speed, gear);
        this.rpm += (targetRPMForGear - this.rpm) * dt * 0.8;
      }
    }

    if (this.brake > 0) {
      const maxBrakeDeceleration = 35;
      const brakeDeceleration = (this.brake / 100) * maxBrakeDeceleration;
      this.speed -= brakeDeceleration * dt;
      this.speed = Math.max(0, this.speed);

      if (gear > 0) {
        const targetRPM = this.calculateRPMFromSpeed(this.speed, gear);
        this.rpm += (targetRPM - this.rpm) * dt * 4;
      } else {
        const targetIdleRPM = this.getIdleRPM();
        this.rpm += (targetIdleRPM - this.rpm) * dt * 5;
      }
    } else if (gear === 0) {
      const targetRPM = this.getTargetRPMFromThrottle(this.throttle);
      this.rpm += (targetRPM - this.rpm) * dt * 5;

      const rollingResistance = 60;
      const airResistance = 0.4 * this.speed * this.speed;
      const deceleration = (rollingResistance + airResistance) / 1200;
      this.speed -= deceleration * dt * 3.6;
      this.speed = Math.max(0, this.speed);
    } else {
      const targetRPM = this.getTargetRPMFromThrottle(this.throttle);

      const rpmChangeRate = this.throttle > 0 ? 600 : 120;
      this.rpm += (targetRPM - this.rpm) * dt * (rpmChangeRate / 1000);

      const theoreticalSpeed = this.calculateSpeedFromRPM(this.rpm, gear);

      const mass = 1800;
      const rollingResistance = 30;
      const airResistance = 0.25 * this.speed * this.speed;

      const gearRatio = this.getGearRatios()[gear];
      const engineBrakingBase = this.throttle === 0 ? gearRatio * 400 : 0;
      const speedFactor = Math.min(1, this.speed / 30);
      const engineBraking = engineBrakingBase * speedFactor;

      let acceleration = 0;

      if (gear > 0 && theoreticalSpeed > this.speed + 0.5) {
        const rpmAboveIdle = Math.max(0, this.rpm - this.getIdleRPM());
        const throttleFactor = this.throttle / 100;
        const engineForce = rpmAboveIdle * gearRatio * 3.0 * throttleFactor;

        const netForce = engineForce - rollingResistance - airResistance - engineBraking;
        acceleration = netForce / mass;
      } else {
        const deceleration = (rollingResistance + airResistance + engineBraking) / mass;
        acceleration = -deceleration;
      }

      this.speed += acceleration * dt * 3.6;
      this.speed = Math.max(0, Math.min(240, this.speed));

      if (this.speed < 0.5 && this.throttle < 5) {
        this.speed = 0;
      }
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

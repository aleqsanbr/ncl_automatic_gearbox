import { FuzzyGearbox } from './fuzzy-engine.js';

export class CarSimulator {
  constructor() {
    this.speed = 0;
    this.rpm = 900;
    this.throttle = 0;
    this.brake = 0;
    this.lastSpeed = 0;

    this.fuzzy = new FuzzyGearbox();
    this.isShifting = false;
    this.shiftTime = 0;
    this.targetRPM = 900;
  }

  getGearRatios() {
    return [3.5, 2.1, 1.4, 1.0, 0.8, 0.65, 0.55];
  }

  getGearSpeeds() {
    return [
      { min: 0, max: 7 },
      { min: 5, max: 20 },
      { min: 15, max: 32 },
      { min: 28, max: 45 },
      { min: 40, max: 58 },
      { min: 53, max: 70 },
      { min: 65, max: 220 }
    ];
  }

  getBaseRPM() {
    if (this.fuzzy.mode === 'D') {
      return [900, 1100, 1300, 1400, 1400, 1400, 1200];
    } else {
      // Sport: значительно более высокие обороты для динамики
      return [2000, 2500, 3500, 3500, 4000, 4500, 4000];
    }
  }

  getShiftRPM() {
    if (this.fuzzy.mode === 'D') {
      return [1800, 1800, 1700, 1600, 1500, 1400, 1300];
    } else {
      // Sport: держим обороты высокими для максимальной мощности
      return [4000, 4200, 4500, 4800, 5200, 5500, 5800];
    }
  }

  calculateRPMForSpeed(speed, gear) {
    if (speed < 1) return this.getBaseRPM()[gear - 1];

    const gearSpeeds = this.getGearSpeeds();
    const baseRPMs = this.getBaseRPM();
    const shiftRPMs = this.getShiftRPM();

    const gearData = gearSpeeds[gear - 1];
    const baseRPM = baseRPMs[gear - 1];
    const shiftRPM = shiftRPMs[gear - 1];

    // Линейная интерполяция RPM по скорости
    const speedRatio = (speed - gearData.min) / (gearData.max - gearData.min);
    const calculatedRPM = baseRPM + (shiftRPM - baseRPM) * speedRatio;

    // Ограничиваем RPM только снизу и сверху
    return Math.max(baseRPM * 0.8, Math.min(6500, calculatedRPM));
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
    const powerFactor = 85; // Баланс: реалистичный разгон + макс скорость 210+ км/ч
    const rollingResistance = 30;
    const airResistanceCoeff = 0.25;

    const throttleForce = this.throttle * powerFactor;
    const airResistance = airResistanceCoeff * this.speed * this.speed;
    const brakeForce = this.brake * 60;

    const gear = this.fuzzy.currentGear;
    const engineBrakingFactor = this.throttle === 0 ? (8 - gear) * 3 : 0;

    const netForce = throttleForce - airResistance - rollingResistance - brakeForce - engineBrakingFactor;
    const acceleration = netForce / mass;

    // Правильная физика: acceleration в м/с², dt в секундах
    // Конвертируем м/с в км/ч: умножаем на 3.6
    this.speed += acceleration * dt * 3.6;
    this.speed = Math.max(0, Math.min(220, this.speed));

    const inputs = {
      speed: this.speed,
      rpm: this.rpm,
      brake: this.brake
    };

    const result = this.fuzzy.getRecommendedGear(inputs);

    // КРИТИЧНО: При торможении или снижении скорости ЗАПРЕЩАЕМ upshift
    const isSlowingDown = this.speed < this.lastSpeed - 0.1;
    const isActiveBraking = this.brake > 20;

    if ((isSlowingDown || isActiveBraking) && result.recommended > this.fuzzy.currentGear) {
      // ПОЛНОСТЬЮ блокируем любой upshift при торможении
      result.recommended = this.fuzzy.currentGear;
      this.fuzzy.lastRecommended = this.fuzzy.currentGear;
      this.fuzzy.recommendedCounter = 0;
    }
    this.lastSpeed = this.speed;

    if (result.currentGear !== result.recommended && !this.isShifting) {
      this.isShifting = true;
      this.shiftTime = 0;
    }

    if (this.isShifting) {
      this.shiftTime += dt;

      if (this.shiftTime < 0.15) {
        this.rpm += (this.targetRPM * 0.7 - this.rpm) * dt * 8;
      } else if (this.shiftTime < 0.3) {
        const newTargetRPM = this.calculateRPMForSpeed(this.speed, this.fuzzy.currentGear);
        this.rpm += (newTargetRPM - this.rpm) * dt * 6;
      } else {
        this.isShifting = false;
        this.shiftTime = 0;
      }

      return result;
    }

    this.targetRPM = this.calculateRPMForSpeed(this.speed, gear);

    // КРИТИЧНО: RPM всегда соответствует ТЕКУЩЕЙ передаче, а не рекомендованной
    // Это предотвращает дергание RPM когда система рекомендует переключение
    const targetRPMForCurrentGear = this.targetRPM;

    if (this.brake > 30) {
      // При торможении RPM падает ниже
      this.rpm += (this.targetRPM * 0.8 - this.rpm) * dt * 5;
    } else {
      // Обычное сглаживание к целевому RPM для ТЕКУЩЕЙ передачи
      this.rpm += (this.targetRPM - this.rpm) * dt * 4;
    }

    this.rpm = Math.max(800, Math.min(6500, this.rpm));

    return result;
  }

  setMode(mode) {
    this.fuzzy.setMode(mode);
    // КРИТИЧНО: При смене режима СРАЗУ пересчитываем передачу
    const inputs = {
      speed: this.speed,
      rpm: this.rpm,
      brake: this.brake
    };
    const result = this.fuzzy.getRecommendedGear(inputs);
    // Форсируем переключение передачи
    this.fuzzy.lastSwitch = 0;
    this.fuzzy.recommendedCounter = 10;
    // Пересчитываем RPM для новой передачи
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

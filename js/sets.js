const triangle = (x, left, peak, right) => {
  if (x <= left || x >= right) return 0;
  if (x === peak) return 1;
  if (x < peak) return (x - left) / (peak - left);
  return (right - x) / (right - peak);
};

const trapezoid = (x, left, leftTop, rightTop, right) => {
  if (x < left || x > right) return 0;
  if (x >= leftTop && x <= rightTop) return 1;
  if (x < leftTop) return (x - left) / (leftTop - left);
  return (right - x) / (right - rightTop);
};

export const createFuzzySets = (mode) => {
  if (mode === 'D') {
    return {
      speed: {
        gear1: (x) => trapezoid(x, 0, 0, 8, 15),
        gear2: (x) => trapezoid(x, 5, 10, 25, 35),
        gear3: (x) => trapezoid(x, 25, 28, 38, 45),
        gear4: (x) => trapezoid(x, 38, 40, 50, 58),
        gear5: (x) => trapezoid(x, 50, 52, 65, 75),
        gear6: (x) => trapezoid(x, 58, 63, 70, 74),
        gear7: (x) => trapezoid(x, 70, 74, 220, 220),
        veryLow: (x) => trapezoid(x, 0, 0, 1, 3)
      },
      rpm: {
        idle: (x) => trapezoid(x, 800, 900, 1100, 1200),
        low: (x) => trapezoid(x, 1000, 1200, 1400, 1600),
        medium: (x) => trapezoid(x, 1400, 1500, 1700, 1900),
        high: (x) => trapezoid(x, 1700, 1800, 2500, 6000),
        veryHigh: (x) => trapezoid(x, 2400, 3000, 6000, 6000)
      },
      brake: {
        none: (x) => trapezoid(x, 0, 0, 5, 15),
        light: (x) => trapezoid(x, 10, 15, 30, 40),
        medium: (x) => trapezoid(x, 35, 50, 70, 80),
        heavy: (x) => trapezoid(x, 75, 85, 100, 100)
      },
      throttle: {
        none: (x) => trapezoid(x, 0, 0, 5, 15),
        light: (x) => trapezoid(x, 10, 20, 40, 50),
        medium: (x) => trapezoid(x, 40, 55, 75, 85),
        high: (x) => trapezoid(x, 80, 90, 100, 100)
      },
      urgentDownshift: (brake, speed) => {
        if (brake < 70) return 0;
        return Math.min(1, (brake - 70) / 30);
      },
      gentleDownshift: (throttle, speed) => {
        if (throttle > 10) return 0;
        if (speed < 3) return 0;
        return Math.min(1, (10 - throttle) / 10);
      }
    };
  } else {
    return {
      speed: {
        gear1: (x) => trapezoid(x, 0, 0, 20, 32),
        gear2: (x) => trapezoid(x, 20, 28, 50, 60),
        gear3: (x) => trapezoid(x, 50, 55, 70, 80),
        gear4: (x) => trapezoid(x, 70, 75, 90, 100),
        gear5: (x) => trapezoid(x, 90, 95, 120, 135),
        gear6: (x) => trapezoid(x, 120, 130, 220, 220),
        veryLow: (x) => trapezoid(x, 0, 0, 3, 8)
      },
      rpm: {
        idle: (x) => trapezoid(x, 800, 1500, 2200, 2800),
        low: (x) => trapezoid(x, 2300, 2800, 3500, 4000),
        medium: (x) => trapezoid(x, 3400, 3800, 4200, 4500),
        high: (x) => trapezoid(x, 4100, 4200, 5500, 6000),
        veryHigh: (x) => trapezoid(x, 5300, 6000, 6500, 6500)
      },
      brake: {
        none: (x) => trapezoid(x, 0, 0, 5, 15),
        light: (x) => trapezoid(x, 10, 15, 30, 40),
        medium: (x) => trapezoid(x, 35, 50, 70, 80),
        heavy: (x) => trapezoid(x, 75, 85, 100, 100)
      },
      throttle: {
        none: (x) => trapezoid(x, 0, 0, 5, 15),
        light: (x) => trapezoid(x, 10, 20, 45, 55),
        medium: (x) => trapezoid(x, 45, 60, 80, 90),
        high: (x) => trapezoid(x, 80, 90, 100, 100)
      },
      urgentDownshift: (brake, speed) => {
        if (brake < 70) return 0;
        return Math.min(1, (brake - 70) / 30);
      },
      gentleDownshift: (throttle, speed) => {
        if (throttle > 15) return 0;
        if (speed < 5) return 0;
        return Math.min(1, (15 - throttle) / 15);
      }
    };
  }
};

export const fuzzify = (inputs, mode) => {
  const sets = createFuzzySets(mode);
  const result = {
    speed: {},
    rpm: {},
    brake: {},
    throttle: {},
    control: {}
  };

  for (const [setName, func] of Object.entries(sets.speed)) {
    result.speed[setName] = func(inputs.speed);
  }

  for (const [setName, func] of Object.entries(sets.rpm)) {
    result.rpm[setName] = func(inputs.rpm);
  }

  for (const [setName, func] of Object.entries(sets.brake)) {
    result.brake[setName] = func(inputs.brake);
  }

  for (const [setName, func] of Object.entries(sets.throttle)) {
    result.throttle[setName] = func(inputs.throttle);
  }

  result.control.urgentDownshift = sets.urgentDownshift(inputs.brake, inputs.speed);
  result.control.gentleDownshift = sets.gentleDownshift(inputs.throttle, inputs.speed);

  return result;
};

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
        gear0: (x) => trapezoid(x, 0, 0, 2, 5),
        gear1: (x) => trapezoid(x, 0, 0, 5, 12),
        gear2: (x) => triangle(x, 8, 14, 23),
        gear3: (x) => triangle(x, 18, 26, 36),
        gear4: (x) => triangle(x, 32, 39, 50),
        gear5: (x) => triangle(x, 45, 52, 62),
        gear6: (x) => triangle(x, 58, 64, 73),
        gear7: (x) => trapezoid(x, 68, 75, 220, 220)
      },
      rpm: {
        idle: (x) => trapezoid(x, 800, 900, 1200, 1400),
        low: (x) => triangle(x, 1300, 1500, 1700),
        medium: (x) => triangle(x, 1600, 1750, 1900),
        high: (x) => triangle(x, 1800, 2000, 2500),
        veryHigh: (x) => trapezoid(x, 2300, 3000, 6000, 6000)
      },
      brake: {
        none: (x) => trapezoid(x, 0, 0, 5, 15),
        light: (x) => triangle(x, 10, 25, 40),
        medium: (x) => triangle(x, 35, 55, 75),
        heavy: (x) => trapezoid(x, 65, 80, 100, 100)
      },
      throttle: {
        none: (x) => trapezoid(x, 0, 0, 5, 15),
        light: (x) => triangle(x, 10, 25, 45),
        medium: (x) => triangle(x, 40, 60, 80),
        high: (x) => trapezoid(x, 75, 85, 100, 100)
      }
    };
  } else {
    return {
      speed: {
        gear0: (x) => trapezoid(x, 0, 0, 2, 5),
        gear1: (x) => trapezoid(x, 0, 0, 15, 28),
        gear2: (x) => triangle(x, 22, 35, 50),
        gear3: (x) => triangle(x, 42, 55, 70),
        gear4: (x) => triangle(x, 62, 75, 90),
        gear5: (x) => triangle(x, 82, 95, 110),
        gear6: (x) => trapezoid(x, 100, 110, 220, 220)
      },
      rpm: {
        idle: (x) => trapezoid(x, 800, 2000, 2700, 3200),
        low: (x) => triangle(x, 3000, 3500, 3900),
        medium: (x) => triangle(x, 3700, 4100, 4400),
        high: (x) => triangle(x, 4200, 4600, 5100),
        veryHigh: (x) => trapezoid(x, 4900, 5500, 6500, 6500)
      },
      brake: {
        none: (x) => trapezoid(x, 0, 0, 5, 15),
        light: (x) => triangle(x, 10, 25, 40),
        medium: (x) => triangle(x, 35, 55, 75),
        heavy: (x) => trapezoid(x, 65, 80, 100, 100)
      },
      throttle: {
        none: (x) => trapezoid(x, 0, 0, 5, 15),
        light: (x) => triangle(x, 10, 25, 45),
        medium: (x) => triangle(x, 40, 60, 80),
        high: (x) => trapezoid(x, 75, 85, 100, 100)
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
    throttle: {}
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

  return result;
};

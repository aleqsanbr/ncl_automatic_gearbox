const triangle = (x, left, peak, right) => {
  if (x <= left || x >= right) return 0;
  if (x === peak) return 1;
  if (x < peak) return (x - left) / (peak - left);
  return (right - x) / (right - peak);
};

const trapezoid = (x, left, leftTop, rightTop, right) => {
  if (x <= left || x >= right) return 0;
  if (x >= leftTop && x <= rightTop) return 1;
  if (x < leftTop) return (x - left) / (leftTop - left);
  return (right - x) / (right - rightTop);
};

export const createFuzzySets = (mode) => {
  if (mode === 'D') {
    return {
      speed: {
        veryLow: (x) => trapezoid(x, 0, 0, 5, 10),
        low: (x) => triangle(x, 5, 15, 25),
        medium: (x) => triangle(x, 20, 35, 50),
        high: (x) => triangle(x, 45, 65, 80),
        veryHigh: (x) => trapezoid(x, 75, 90, 220, 220)
      },
      rpm: {
        idle: (x) => trapezoid(x, 800, 900, 1100, 1300),
        low: (x) => triangle(x, 1100, 1400, 1600),
        medium: (x) => triangle(x, 1500, 1700, 1900),
        high: (x) => triangle(x, 1800, 2200, 2800),
        veryHigh: (x) => trapezoid(x, 2500, 3500, 6000, 6000)
      },
      brake: {
        none: (x) => trapezoid(x, 0, 0, 5, 15),
        light: (x) => triangle(x, 10, 25, 40),
        medium: (x) => triangle(x, 35, 55, 75),
        heavy: (x) => trapezoid(x, 65, 80, 100, 100)
      }
    };
  } else {
    return {
      speed: {
        veryLow: (x) => trapezoid(x, 0, 0, 20, 30),
        low: (x) => triangle(x, 25, 40, 55),
        medium: (x) => triangle(x, 50, 70, 90),
        high: (x) => triangle(x, 85, 105, 125),
        veryHigh: (x) => trapezoid(x, 120, 140, 220, 220)
      },
      rpm: {
        idle: (x) => trapezoid(x, 800, 2000, 2500, 3000),
        low: (x) => triangle(x, 2500, 3500, 3900),
        medium: (x) => triangle(x, 3800, 4100, 4400),
        high: (x) => triangle(x, 4300, 4800, 5300),
        veryHigh: (x) => trapezoid(x, 5000, 5500, 6500, 6500)
      },
      brake: {
        none: (x) => trapezoid(x, 0, 0, 5, 15),
        light: (x) => triangle(x, 10, 25, 40),
        medium: (x) => triangle(x, 35, 55, 75),
        heavy: (x) => trapezoid(x, 65, 80, 100, 100)
      }
    };
  }
};

export const fuzzify = (inputs, mode) => {
  const sets = createFuzzySets(mode);

  const result = {
    speed: {},
    rpm: {},
    brake: {}
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

  return result;
};

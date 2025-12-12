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
        gear1: (x) => trapezoid(x, 0, 0, 5, 12), // 0-12 км/ч → 1-2п
        gear2: (x) => triangle(x, 8, 14, 23), // 8-23 км/ч → 2-3п
        gear3: (x) => triangle(x, 18, 26, 36), // 18-36 км/ч → 3-4п
        gear4: (x) => triangle(x, 32, 39, 50), // 32-50 км/ч → 4-5п
        gear5: (x) => triangle(x, 45, 52, 62), // 45-62 км/ч → 5-6п
        gear6: (x) => triangle(x, 58, 64, 73), // 58-73 км/ч → 6-7п
        gear7: (x) => trapezoid(x, 68, 75, 220, 220) // 68+ км/ч → 7п
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
      }
    };
  } else {
    return {
      speed: {
        gear1: (x) => trapezoid(x, 0, 0, 15, 28), // 0-28 км/ч → 1-2п
        gear2: (x) => triangle(x, 22, 35, 50), // 22-50 км/ч → 2-3п
        gear3: (x) => triangle(x, 42, 55, 70), // 42-70 км/ч → 3-4п
        gear4: (x) => triangle(x, 62, 75, 90), // 62-90 км/ч → 4-5п
        gear5: (x) => triangle(x, 82, 95, 110), // 82-110 км/ч → 5-6п
        gear6: (x) => trapezoid(x, 100, 110, 220, 220) // 100+ км/ч → 6п
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

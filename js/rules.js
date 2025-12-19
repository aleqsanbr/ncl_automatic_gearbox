export const getRules = (mode) => {
  if (mode === 'D') {
    return [
      // ===== ОСТАНОВКА =====
      { conditions: ['speed.veryLow', 'throttle.none'], gear: 0, priority: 100 },
      { conditions: ['speed.gear1', 'throttle.none'], gear: 0, priority: 99 },

      // ===== СТАРТ С МЕСТА (0-7 км/ч, 900-1800 RPM) =====
      { conditions: ['speed.gear1', 'rpm.idle'], gear: 1, priority: 95 },
      { conditions: ['speed.gear1', 'rpm.low', 'throttle.light'], gear: 1, priority: 93 },
      { conditions: ['speed.gear1', 'rpm.low', 'throttle.medium'], gear: 1, priority: 91 },

      // ===== ПЕРЕХОД НА 2-Ю (5-20 км/ч, ~1800 RPM) =====
      // Переходим на 2-ю ТОЛЬКО при высоких оборотах (1800+)
      { conditions: ['speed.gear1', 'rpm.high', 'throttle.light'], gear: 2, priority: 88 },
      { conditions: ['speed.gear1', 'rpm.high', 'throttle.medium'], gear: 2, priority: 87 },
      { conditions: ['speed.gear1', 'rpm.high', 'throttle.high'], gear: 2, priority: 86 },

      // ===== 2-Я ПЕРЕДАЧА (5-20 км/ч) =====
      // КРЕПКО ДЕРЖИМ 2-Ю - не даём сразу прыгнуть на 4-ю
      { conditions: ['speed.gear2', 'rpm.idle'], gear: 2, priority: 94 },
      { conditions: ['speed.gear2', 'rpm.low', 'throttle.light'], gear: 2, priority: 92 },
      { conditions: ['speed.gear2', 'rpm.low', 'throttle.medium'], gear: 2, priority: 90 },
      { conditions: ['speed.gear2', 'rpm.medium', 'throttle.light'], gear: 2, priority: 88 },

      // ===== ПЕРЕХОД НА 3-Ю (20 км/ч, ~1800 RPM) =====
      // Только при явно достаточной скорости И оборотах
      { conditions: ['speed.gear2', 'rpm.medium', 'throttle.medium'], gear: 3, priority: 85 },
      { conditions: ['speed.gear2', 'rpm.high', 'throttle.medium'], gear: 3, priority: 84 },
      { conditions: ['speed.gear2', 'rpm.high', 'throttle.high'], gear: 3, priority: 83 },

      // ===== 3-Я ПЕРЕДАЧА (20-32 км/ч) =====
      { conditions: ['speed.gear3', 'rpm.idle'], gear: 3, priority: 92 },
      { conditions: ['speed.gear3', 'rpm.low', 'throttle.light'], gear: 3, priority: 90 },
      { conditions: ['speed.gear3', 'rpm.low', 'throttle.medium'], gear: 3, priority: 88 },
      { conditions: ['speed.gear3', 'rpm.medium', 'throttle.light'], gear: 3, priority: 86 },

      // ===== ПЕРЕХОД НА 4-Ю (32 км/ч, ~1700 RPM) =====
      { conditions: ['speed.gear3', 'rpm.medium', 'throttle.medium'], gear: 4, priority: 83 },
      { conditions: ['speed.gear3', 'rpm.high', 'throttle.medium'], gear: 4, priority: 82 },
      { conditions: ['speed.gear3', 'rpm.high', 'throttle.high'], gear: 4, priority: 81 },

      // ===== 4-Я ПЕРЕДАЧА (32-45 км/ч) =====
      { conditions: ['speed.gear4', 'rpm.idle'], gear: 4, priority: 90 },
      { conditions: ['speed.gear4', 'rpm.low', 'throttle.light'], gear: 4, priority: 88 },
      { conditions: ['speed.gear4', 'rpm.low', 'throttle.medium'], gear: 4, priority: 86 },
      { conditions: ['speed.gear4', 'rpm.medium', 'throttle.light'], gear: 4, priority: 84 },

      // ===== ПЕРЕХОД НА 5-Ю (45 км/ч, ~1600 RPM) =====
      { conditions: ['speed.gear4', 'rpm.medium', 'throttle.medium'], gear: 5, priority: 81 },
      { conditions: ['speed.gear4', 'rpm.high', 'throttle.medium'], gear: 5, priority: 80 },
      { conditions: ['speed.gear4', 'rpm.high', 'throttle.high'], gear: 5, priority: 79 },

      // ===== 5-Я ПЕРЕДАЧА (45-58 км/ч) =====
      { conditions: ['speed.gear5', 'rpm.idle'], gear: 5, priority: 88 },
      { conditions: ['speed.gear5', 'rpm.low', 'throttle.light'], gear: 5, priority: 86 },
      { conditions: ['speed.gear5', 'rpm.low', 'throttle.medium'], gear: 5, priority: 84 },
      { conditions: ['speed.gear5', 'rpm.medium', 'throttle.light'], gear: 5, priority: 82 },

      // ===== ПЕРЕХОД НА 6-Ю (58 км/ч, ~1500 RPM) =====
      { conditions: ['speed.gear5', 'rpm.medium', 'throttle.medium'], gear: 6, priority: 79 },
      { conditions: ['speed.gear5', 'rpm.high', 'throttle.medium'], gear: 6, priority: 78 },
      { conditions: ['speed.gear5', 'rpm.high', 'throttle.high'], gear: 6, priority: 77 },

      // ===== 6-Я ПЕРЕДАЧА (58-70 км/ч) =====
      { conditions: ['speed.gear6', 'rpm.idle'], gear: 6, priority: 86 },
      { conditions: ['speed.gear6', 'rpm.low', 'throttle.light'], gear: 6, priority: 84 },
      { conditions: ['speed.gear6', 'rpm.low', 'throttle.medium'], gear: 6, priority: 82 },
      { conditions: ['speed.gear6', 'rpm.medium', 'throttle.light'], gear: 6, priority: 80 },

      // ===== ПЕРЕХОД НА 7-Ю (70 км/ч, ~1400 RPM) =====
      { conditions: ['speed.gear6', 'rpm.medium', 'throttle.medium'], gear: 7, priority: 77 },
      { conditions: ['speed.gear6', 'rpm.high', 'throttle.medium'], gear: 7, priority: 76 },

      // ===== 7-Я ПЕРЕДАЧА (70+ км/ч) =====
      { conditions: ['speed.gear7', 'rpm.idle'], gear: 7, priority: 84 },
      { conditions: ['speed.gear7', 'rpm.low', 'throttle.none'], gear: 7, priority: 82 },
      { conditions: ['speed.gear7', 'rpm.low', 'throttle.light'], gear: 7, priority: 80 },
      { conditions: ['speed.gear7', 'rpm.medium'], gear: 7, priority: 78 },

      // ===== ТОРМОЖЕНИЕ - НЕ КОНФЛИКТУЕТ С ОСНОВНОЙ ЛОГИКОЙ =====
      // При лёгком торможении просто держим текущую
      { conditions: ['brake.light'], gear: -1, priority: 70 }, // -1 = держать текущую

      // При среднем торможении мягко downshift
      { conditions: ['brake.medium', 'speed.gear7'], gear: 6, priority: 80 },
      { conditions: ['brake.medium', 'speed.gear6'], gear: 5, priority: 80 },
      { conditions: ['brake.medium', 'speed.gear5'], gear: 4, priority: 80 },
      { conditions: ['brake.medium', 'speed.gear4'], gear: 3, priority: 80 },

      // При сильном торможении агрессивный downshift
      { conditions: ['brake.heavy', 'speed.gear7'], gear: 5, priority: 95 },
      { conditions: ['brake.heavy', 'speed.gear6'], gear: 4, priority: 95 },
      { conditions: ['brake.heavy', 'speed.gear5'], gear: 3, priority: 95 },
      { conditions: ['brake.heavy', 'speed.gear4'], gear: 2, priority: 95 },
      { conditions: ['brake.heavy', 'speed.gear3'], gear: 1, priority: 95 }
    ];
  } else {
    // SPORT MODE - по reference
    return [
      { conditions: ['speed.veryLow', 'throttle.none'], gear: 0, priority: 100 },
      { conditions: ['speed.gear1', 'throttle.none'], gear: 0, priority: 99 },

      // ===== 1-Я ПЕРЕДАЧА (0-25 км/ч) =====
      { conditions: ['speed.gear1', 'rpm.idle'], gear: 1, priority: 94 },
      { conditions: ['speed.gear1', 'rpm.low', 'throttle.medium'], gear: 1, priority: 91 },
      { conditions: ['speed.gear1', 'rpm.low', 'throttle.high'], gear: 1, priority: 89 },

      // ===== ПЕРЕХОД НА 2-Ю (25 км/ч, 4000 RPM) =====
      // В спорте требуем ВЫСОКИХ оборотов (4000+)
      { conditions: ['speed.gear1', 'rpm.high', 'throttle.medium'], gear: 2, priority: 87 },
      { conditions: ['speed.gear1', 'rpm.high', 'throttle.high'], gear: 2, priority: 86 },
      { conditions: ['speed.gear1', 'rpm.veryHigh', 'throttle.high'], gear: 2, priority: 88 },

      // ===== 2-Я ПЕРЕДАЧА (25-45 км/ч) =====
      { conditions: ['speed.gear2', 'rpm.low', 'throttle.medium'], gear: 2, priority: 89 },
      { conditions: ['speed.gear2', 'rpm.low', 'throttle.high'], gear: 2, priority: 87 },
      { conditions: ['speed.gear2', 'rpm.medium', 'throttle.high'], gear: 2, priority: 85 },

      // ===== ПЕРЕХОД НА 3-Ю (45 км/ч, 4200 RPM) =====
      { conditions: ['speed.gear2', 'rpm.high', 'throttle.medium'], gear: 3, priority: 84 },
      { conditions: ['speed.gear2', 'rpm.high', 'throttle.high'], gear: 3, priority: 83 },
      { conditions: ['speed.gear2', 'rpm.veryHigh'], gear: 3, priority: 85 },

      // ===== 3-Я ПЕРЕДАЧА (45-65 км/ч) =====
      { conditions: ['speed.gear3', 'rpm.low', 'throttle.medium'], gear: 3, priority: 87 },
      { conditions: ['speed.gear3', 'rpm.medium', 'throttle.high'], gear: 3, priority: 85 },

      // ===== ПЕРЕХОД НА 4-Ю (65 км/ч, 4200 RPM) =====
      { conditions: ['speed.gear3', 'rpm.high', 'throttle.medium'], gear: 4, priority: 82 },
      { conditions: ['speed.gear3', 'rpm.high', 'throttle.high'], gear: 4, priority: 81 },
      { conditions: ['speed.gear3', 'rpm.veryHigh'], gear: 4, priority: 83 },

      // ===== 4-Я ПЕРЕДАЧА (65-85 км/ч) =====
      { conditions: ['speed.gear4', 'rpm.low', 'throttle.medium'], gear: 4, priority: 85 },
      { conditions: ['speed.gear4', 'rpm.medium', 'throttle.high'], gear: 4, priority: 83 },

      // ===== ПЕРЕХОД НА 5-Ю (85 км/ч, 4200 RPM) =====
      { conditions: ['speed.gear4', 'rpm.high', 'throttle.medium'], gear: 5, priority: 80 },
      { conditions: ['speed.gear4', 'rpm.high', 'throttle.high'], gear: 5, priority: 79 },
      { conditions: ['speed.gear4', 'rpm.veryHigh'], gear: 5, priority: 81 },

      // ===== 5-Я ПЕРЕДАЧА (85-105 км/ч) =====
      { conditions: ['speed.gear5', 'rpm.low', 'throttle.medium'], gear: 5, priority: 83 },
      { conditions: ['speed.gear5', 'rpm.medium', 'throttle.high'], gear: 5, priority: 81 },

      // ===== ПЕРЕХОД НА 6-Ю (105 км/ч, 4200 RPM) =====
      { conditions: ['speed.gear5', 'rpm.high', 'throttle.medium'], gear: 6, priority: 78 },
      { conditions: ['speed.gear5', 'rpm.high', 'throttle.high'], gear: 6, priority: 77 },
      { conditions: ['speed.gear5', 'rpm.veryHigh'], gear: 6, priority: 79 },

      // ===== 6-Я ПЕРЕДАЧА (105+ км/ч) =====
      { conditions: ['speed.gear6', 'rpm.low', 'throttle.medium'], gear: 6, priority: 81 },
      { conditions: ['speed.gear6', 'rpm.medium', 'throttle.high'], gear: 6, priority: 79 },
      { conditions: ['speed.gear6', 'rpm.high'], gear: 6, priority: 77 },

      // ===== ТОРМОЖЕНИЕ В СПОРТЕ =====
      { conditions: ['brake.light'], gear: -1, priority: 70 },

      { conditions: ['brake.medium', 'speed.gear6'], gear: 5, priority: 80 },
      { conditions: ['brake.medium', 'speed.gear5'], gear: 4, priority: 80 },
      { conditions: ['brake.medium', 'speed.gear4'], gear: 3, priority: 80 },

      { conditions: ['brake.heavy', 'speed.gear6'], gear: 4, priority: 95 },
      { conditions: ['brake.heavy', 'speed.gear5'], gear: 3, priority: 95 },
      { conditions: ['brake.heavy', 'speed.gear4'], gear: 2, priority: 95 }
    ];
  }
};

export const getRules = (mode) => {
  if (mode === 'D') {
    return [
      { conditions: ['speed.gear0', 'throttle.none'], gear: 0, priority: 100 },
      { conditions: ['speed.gear0', 'throttle.light'], gear: 1, priority: 98 },
      { conditions: ['speed.gear0', 'throttle.medium'], gear: 1, priority: 98 },
      { conditions: ['speed.gear0', 'throttle.high'], gear: 1, priority: 98 },

      { conditions: ['speed.gear1', 'rpm.idle'], gear: 1, priority: 100 },
      { conditions: ['speed.gear1', 'rpm.low'], gear: 1, priority: 95 },
      { conditions: ['speed.gear1'], gear: 1, priority: 92 },

      { conditions: ['speed.gear1', 'rpm.high'], gear: 2, priority: 90 },
      { conditions: ['speed.gear2', 'rpm.idle'], gear: 2, priority: 93 },
      { conditions: ['speed.gear2', 'rpm.low'], gear: 2, priority: 90 },

      { conditions: ['speed.gear2', 'rpm.high'], gear: 3, priority: 85 },
      { conditions: ['speed.gear3', 'rpm.idle'], gear: 3, priority: 85 },
      { conditions: ['speed.gear3', 'rpm.low'], gear: 3, priority: 82 },

      { conditions: ['speed.gear3', 'rpm.high'], gear: 4, priority: 80 },
      { conditions: ['speed.gear4', 'rpm.idle'], gear: 4, priority: 85 },
      { conditions: ['speed.gear4', 'rpm.low'], gear: 4, priority: 80 },

      { conditions: ['speed.gear4', 'rpm.high'], gear: 5, priority: 78 },
      { conditions: ['speed.gear5', 'rpm.idle'], gear: 5, priority: 85 },
      { conditions: ['speed.gear5', 'rpm.low'], gear: 5, priority: 80 },

      { conditions: ['speed.gear5', 'rpm.high'], gear: 6, priority: 78 },
      { conditions: ['speed.gear6', 'rpm.idle'], gear: 6, priority: 85 },
      { conditions: ['speed.gear6', 'rpm.low'], gear: 6, priority: 80 },

      { conditions: ['speed.gear6', 'rpm.high'], gear: 7, priority: 78 },
      { conditions: ['speed.gear7', 'rpm.idle'], gear: 7, priority: 90 },
      { conditions: ['speed.gear7', 'rpm.low'], gear: 7, priority: 85 },
      { conditions: ['speed.gear7', 'rpm.medium'], gear: 7, priority: 80 },

      { conditions: ['brake.heavy'], gear: 'downshift', priority: 95 },
      { conditions: ['brake.medium'], gear: 'downshift', priority: 85 },
      { conditions: ['brake.light'], gear: 'downshift', priority: 70 },

      { conditions: ['rpm.veryHigh'], gear: 'upshift', priority: 98 }
    ];
  } else {
    return [
      { conditions: ['speed.gear0', 'throttle.none'], gear: 0, priority: 100 },
      { conditions: ['speed.gear0', 'throttle.light'], gear: 1, priority: 98 },
      { conditions: ['speed.gear0', 'throttle.medium'], gear: 1, priority: 98 },
      { conditions: ['speed.gear0', 'throttle.high'], gear: 1, priority: 98 },

      { conditions: ['speed.gear1', 'rpm.idle'], gear: 1, priority: 100 },
      { conditions: ['speed.gear1', 'rpm.low'], gear: 1, priority: 95 },
      { conditions: ['speed.gear1'], gear: 1, priority: 92 },

      { conditions: ['speed.gear1', 'rpm.high'], gear: 2, priority: 90 },
      { conditions: ['speed.gear2', 'rpm.idle'], gear: 2, priority: 90 },
      { conditions: ['speed.gear2', 'rpm.low'], gear: 2, priority: 95 },
      { conditions: ['speed.gear2', 'rpm.medium'], gear: 2, priority: 85 },

      { conditions: ['speed.gear2', 'rpm.high'], gear: 3, priority: 85 },
      { conditions: ['speed.gear3', 'rpm.idle'], gear: 3, priority: 85 },
      { conditions: ['speed.gear3', 'rpm.low'], gear: 3, priority: 95 },
      { conditions: ['speed.gear3', 'rpm.medium'], gear: 3, priority: 90 },

      { conditions: ['speed.gear3', 'rpm.high'], gear: 4, priority: 90 },
      { conditions: ['speed.gear4', 'rpm.idle'], gear: 4, priority: 85 },
      { conditions: ['speed.gear4', 'rpm.low'], gear: 4, priority: 95 },
      { conditions: ['speed.gear4', 'rpm.medium'], gear: 4, priority: 90 },

      { conditions: ['speed.gear4', 'rpm.high'], gear: 5, priority: 90 },
      { conditions: ['speed.gear5', 'rpm.idle'], gear: 5, priority: 85 },
      { conditions: ['speed.gear5', 'rpm.low'], gear: 5, priority: 95 },
      { conditions: ['speed.gear5', 'rpm.medium'], gear: 5, priority: 90 },

      { conditions: ['speed.gear5', 'rpm.high'], gear: 6, priority: 93 },
      { conditions: ['speed.gear6', 'rpm.idle'], gear: 6, priority: 90 },
      { conditions: ['speed.gear6', 'rpm.low'], gear: 6, priority: 95 },
      { conditions: ['speed.gear6', 'rpm.medium'], gear: 6, priority: 93 },
      { conditions: ['speed.gear6', 'rpm.high'], gear: 6, priority: 91 },
      { conditions: ['speed.gear6', 'rpm.veryHigh'], gear: 6, priority: 95 },

      { conditions: ['brake.heavy'], gear: 'downshift', priority: 95 },
      { conditions: ['brake.medium'], gear: 'downshift', priority: 85 },
      { conditions: ['brake.light'], gear: 'downshift', priority: 70 },

      { conditions: ['rpm.veryHigh'], gear: 'upshift', priority: 98 }
    ];
  }
};

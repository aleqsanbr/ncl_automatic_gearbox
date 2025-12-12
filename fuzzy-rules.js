export const getRules = (mode) => {
  if (mode === 'D') {
    return [
      { conditions: ['speed.veryLow', 'rpm.idle'], gear: 1, priority: 100 },
      { conditions: ['speed.veryLow', 'rpm.low'], gear: 1, priority: 90 },

      { conditions: ['speed.veryLow', 'rpm.medium'], gear: 2, priority: 85 },
      { conditions: ['speed.low', 'rpm.idle'], gear: 2, priority: 80 },

      { conditions: ['speed.low', 'rpm.low'], gear: 3, priority: 80 },
      { conditions: ['speed.low', 'rpm.medium'], gear: 3, priority: 85 },

      { conditions: ['speed.medium', 'rpm.idle'], gear: 4, priority: 80 },
      { conditions: ['speed.medium', 'rpm.low'], gear: 4, priority: 85 },

      { conditions: ['speed.medium', 'rpm.medium'], gear: 5, priority: 80 },
      { conditions: ['speed.high', 'rpm.idle'], gear: 5, priority: 85 },

      { conditions: ['speed.high', 'rpm.low'], gear: 6, priority: 85 },
      { conditions: ['speed.high', 'rpm.medium'], gear: 6, priority: 80 },

      { conditions: ['speed.veryHigh', 'rpm.low'], gear: 7, priority: 90 },
      { conditions: ['speed.veryHigh', 'rpm.idle'], gear: 7, priority: 85 },

      { conditions: ['brake.medium'], gear: 'downshift', priority: 70 },
      { conditions: ['brake.heavy'], gear: 'downshift', priority: 80 },

      { conditions: ['rpm.veryHigh'], gear: 'upshift', priority: 95 }
    ];
  } else {
    return [
      { conditions: ['speed.veryLow', 'rpm.idle'], gear: 1, priority: 100 },
      { conditions: ['speed.veryLow', 'rpm.low'], gear: 1, priority: 90 },

      { conditions: ['speed.veryLow', 'rpm.medium'], gear: 2, priority: 85 },
      { conditions: ['speed.low', 'rpm.low'], gear: 2, priority: 80 },

      { conditions: ['speed.low', 'rpm.medium'], gear: 3, priority: 85 },
      { conditions: ['speed.medium', 'rpm.low'], gear: 3, priority: 80 },

      { conditions: ['speed.medium', 'rpm.medium'], gear: 4, priority: 85 },
      { conditions: ['speed.high', 'rpm.low'], gear: 4, priority: 80 },

      { conditions: ['speed.high', 'rpm.medium'], gear: 5, priority: 85 },

      { conditions: ['speed.veryHigh', 'rpm.medium'], gear: 6, priority: 85 },
      { conditions: ['speed.veryHigh', 'rpm.low'], gear: 6, priority: 80 },

      { conditions: ['speed.veryHigh', 'rpm.high'], gear: 7, priority: 90 },

      { conditions: ['brake.medium'], gear: 'downshift', priority: 70 },
      { conditions: ['brake.heavy'], gear: 'downshift', priority: 80 },

      { conditions: ['rpm.veryHigh'], gear: 'upshift', priority: 95 }
    ];
  }
};

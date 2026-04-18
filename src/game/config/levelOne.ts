export const levelOneConfig = {
  title: '\u7b2c\u4e00\u5173\uff1a\u611f\u53d7 a \u7684\u529b\u91cf',
  slider: {
    min: -2,
    max: 2,
    step: 0.05,
    initial: 0.8,
  },
  domain: {
    xMin: -4.8,
    xMax: 4.8,
    sampleStep: 0.1,
  },
  geometry: {
    gapLeftX: -0.85,
    gapRightX: 0.85,
    spawnX: -2.4,
    landingX: 2.4,
  },
  simulation: {
    frameSampleStride: 4,
  },
  thresholds: {
    flatMax: 0.25,
    steepMin: 1.35,
    success: {
      min: 0.45,
      max: 1.05,
    },
  },
} as const;

export const levelTwoConfig = {
  title: '\u7b2c\u4e8c\u5173\uff1a\u79fb\u52a8\u9876\u70b9',
  mission: {
    eyebrow: '\u9876\u70b9\u5f0f\u6ed1\u9053',
    title: '\u628a\u9876\u70b9\u9001\u8fdb\u76ee\u6807\u5706',
    copy:
      '\u8fd9\u4e00\u5173\u7528 y = a(x - h)^2 + k\u3002\u5148\u7528 h \u548c k \u79fb\u52a8\u9876\u70b9\uff0c\u518d\u7528 a \u8c03\u6574\u5f00\u53e3\u548c\u5761\u5ea6\u3002',
  },
  sliders: {
    a: { min: -0.5, max: 1.4, step: 0.05, initial: 0.4 },
    h: { min: -2.4, max: 1.2, step: 0.05, initial: 0 },
    k: { min: 0, max: 3, step: 0.05, initial: 2.2 },
  },
  targetParameters: { a: 0.55, h: -1.1, k: 1.15 },
  targetVertex: { x: -1.1, y: 1.15, radius: 0.36 },
  domain: { xMin: -4.8, xMax: 4.8, sampleStep: 0.1 },
  geometry: { leftContactX: -2.6, rightContactX: 2.5 },
  platforms: {
    start: { x: -2.6, y: 2.3875 },
    goal: { x: 2.5, y: 8.278 },
  },
  simulation: { frameSampleStride: 4 },
  thresholds: {
    a: { min: 0.35, max: 0.85 },
    platformTolerance: 0.28,
  },
} as const;

import { describe, expect, it } from 'vitest';

import { levelOneConfig } from '../config/levelOne';
import { evaluateParabola } from '../math/parabola';
import {
  createRiderSilhouette,
  getSceneLayout,
  getPlatformAnchorPoints,
  getSceneMathBounds,
  getTrackAnchorPoints,
} from './drawLevel';

describe('drawLevel helpers', () => {
  it('keeps the launch and goal platforms fixed in scene coordinates', () => {
    const anchors = getPlatformAnchorPoints();

    expect(anchors.start).toEqual(levelOneConfig.platforms.start);
    expect(anchors.goal).toEqual(levelOneConfig.platforms.goal);
  });

  it('still computes parabola contact points from the current a value', () => {
    const anchors = getTrackAnchorPoints(0.8);

    expect(anchors.start).toEqual({
      x: levelOneConfig.geometry.spawnX,
      y: evaluateParabola(0.8, levelOneConfig.geometry.spawnX),
    });
    expect(anchors.goal).toEqual({
      x: levelOneConfig.geometry.landingX,
      y: evaluateParabola(0.8, levelOneConfig.geometry.landingX),
    });
  });

  it('keeps the fixed platforms and negative-opening curves inside the visible math bounds', () => {
    const bounds = getSceneMathBounds(-1.2);
    const endpointY = evaluateParabola(-1.2, levelOneConfig.geometry.spawnX);

    expect(bounds.yMin).toBeLessThan(endpointY);
    expect(bounds.yMax).toBeGreaterThan(levelOneConfig.platforms.start.y);
  });

  it('centers tall parabolas horizontally instead of pinning them to the left edge', () => {
    const layout = getSceneLayout({
      width: 720,
      height: 480,
      bounds: getSceneMathBounds(2),
    });

    expect(layout.contentWidth).toBeLessThan(720 - 80);
    expect(layout.leftMargin).toBeGreaterThan(40);
    expect(layout.leftMargin).toBeCloseTo(layout.rightMargin, 3);
  });

  it('builds a skateboarder silhouette with two arms and two legs', () => {
    const silhouette = createRiderSilhouette('ride');

    expect(silhouette.arms).toHaveLength(2);
    expect(silhouette.legs).toHaveLength(2);
  });
});

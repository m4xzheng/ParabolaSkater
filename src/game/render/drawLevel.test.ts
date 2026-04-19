import { describe, expect, it } from 'vitest';

import { levelOneConfig } from '../config/levelOne';
import { levelTwoConfig } from '../config/levelTwo';
import { evaluateParabola, evaluateVertexParabola } from '../math/parabola';
import {
  createRiderSilhouette,
  getLevelTwoPlatformAnchorPoints,
  getLevelTwoSceneMathBounds,
  getLevelTwoTrackAnchorPoints,
  getPlatformAnchorPoints,
  getSceneLayout,
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

  it('keeps level-two platforms fixed and left higher than right', () => {
    const anchors = getLevelTwoPlatformAnchorPoints();

    expect(anchors.start).toEqual(levelTwoConfig.platforms.start);
    expect(anchors.goal).toEqual(levelTwoConfig.platforms.goal);
    expect(anchors.start.y).toBeGreaterThan(anchors.goal.y);
  });

  it('computes level-two track contact points from vertex-form parameters', () => {
    const anchors = getLevelTwoTrackAnchorPoints(levelTwoConfig.targetParameters);

    expect(anchors.start.y).toBeCloseTo(
      evaluateVertexParabola(
        levelTwoConfig.targetParameters,
        levelTwoConfig.geometry.leftContactX,
      ),
      4,
    );
    expect(anchors.goal.y).toBeCloseTo(
      evaluateVertexParabola(
        levelTwoConfig.targetParameters,
        levelTwoConfig.geometry.rightContactX,
      ),
      4,
    );
    expect(anchors.start.y).toBeCloseTo(levelTwoConfig.platforms.start.y, 4);
    expect(anchors.goal.y).toBeCloseTo(levelTwoConfig.platforms.goal.y, 4);
  });

  it('keeps the level-two target circle and platforms inside visible bounds', () => {
    const bounds = getLevelTwoSceneMathBounds(levelTwoConfig.targetParameters);

    expect(bounds.xMin).toBeLessThan(
      levelTwoConfig.targetVertex.x - levelTwoConfig.targetVertex.radius,
    );
    expect(bounds.xMax).toBeGreaterThan(
      levelTwoConfig.targetVertex.x + levelTwoConfig.targetVertex.radius,
    );
    expect(bounds.yMin).toBeLessThan(
      levelTwoConfig.targetVertex.y - levelTwoConfig.targetVertex.radius,
    );
    expect(bounds.yMax).toBeGreaterThan(levelTwoConfig.platforms.goal.y);
  });

  it('places the level-two target on the right and keeps the platform heights physically intuitive', () => {
    const anchors = getLevelTwoPlatformAnchorPoints();

    expect(levelTwoConfig.targetVertex.x).toBeGreaterThan(0);
    expect(anchors.start.y).toBeGreaterThan(anchors.goal.y);
    expect(anchors.goal.y).toBeGreaterThan(levelTwoConfig.targetVertex.y);
  });

  it('keeps the level-two goal platform visually separated from the target circle', () => {
    const anchors = getLevelTwoPlatformAnchorPoints();

    expect(anchors.goal.x - levelTwoConfig.targetVertex.x).toBeGreaterThan(1.25);
    expect(anchors.goal.y - levelTwoConfig.targetVertex.y).toBeGreaterThan(0.9);
  });
});

import { describe, expect, it } from 'vitest';
import { levelOneConfig } from '../config/levelOne';
import { runSimulation } from './runSimulation';

describe('runSimulation', () => {
  it('returns success with animation-ready frames for a teachable value', () => {
    const result = runSimulation({ a: 0.8 });

    expect(result.outcome).toBe('success');
    expect(result.messageKey).toBe('simulation.success');
    expect(result.summary).toBe('Nice work: this parabola gives a smooth jump arc.');
    expect(result.sampling).toEqual({
      domainSampleStep: levelOneConfig.domain.sampleStep,
      frameSampleStride: levelOneConfig.simulation.frameSampleStride,
      frameStep:
        levelOneConfig.domain.sampleStep *
        levelOneConfig.simulation.frameSampleStride,
    });
    expect(result.frames).toHaveLength(25);
    expect(result.frames[0]).toMatchObject({
      index: 0,
      progress: 0,
      state: {
        mathPosition: { x: -4.8, y: 18.432 },
        slope: -7.68,
      },
    });
    expect(result.frames.at(-1)).toMatchObject({
      index: 24,
      progress: 1,
      state: {
        mathPosition: { x: 4.8, y: 18.432 },
        slope: 7.68,
      },
    });
    expect(result.frames[12]).toMatchObject({
      index: 12,
      progress: 0.5,
      state: {
        mathPosition: { x: 0, y: 0 },
        slope: 0,
      },
    });
    expect(result.frames[12]?.state).not.toHaveProperty('screenPosition');
    expect(result.frames[1]?.state.mathPosition.x).toBeCloseTo(
      result.frames[0]!.state.mathPosition.x + result.sampling.frameStep,
      4,
    );
  });

  it('classifies negative a values as opens-down', () => {
    const result = runSimulation({ a: -0.2 });

    expect(result.outcome).toBe('opens-down');
    expect(result.messageKey).toBe('simulation.opens-down');
    expect(result.summary).toBe('Try a positive a so the parabola opens upward.');
  });

  it('classifies shallow upward parabolas as too-flat', () => {
    const result = runSimulation({
      a: levelOneConfig.thresholds.success.min - levelOneConfig.slider.step,
    });

    expect(result.outcome).toBe('too-flat');
    expect(result.messageKey).toBe('simulation.too-flat');
    expect(result.summary).toBe('Increase a a bit so the jump gains more height.');
  });

  it('classifies steep upward parabolas as too-steep', () => {
    const result = runSimulation({
      a: levelOneConfig.thresholds.success.max + levelOneConfig.slider.step,
    });

    expect(result.outcome).toBe('too-steep');
    expect(result.messageKey).toBe('simulation.too-steep');
    expect(result.summary).toBe('Lower a a little so the jump is easier to control.');
  });

  it('treats success band boundaries as success', () => {
    expect(runSimulation({ a: levelOneConfig.thresholds.success.min }).outcome).toBe(
      'success',
    );
    expect(runSimulation({ a: levelOneConfig.thresholds.success.max }).outcome).toBe(
      'success',
    );
  });

  it('treats zero as too-flat', () => {
    const result = runSimulation({ a: 0 });

    expect(result.outcome).toBe('too-flat');
    expect(result.messageKey).toBe('simulation.too-flat');
  });

  it('rejects non-finite a inputs', () => {
    expect(() => runSimulation({ a: Number.NaN })).toThrow(/finite/i);
    expect(() => runSimulation({ a: Number.POSITIVE_INFINITY })).toThrow(/finite/i);
  });
});

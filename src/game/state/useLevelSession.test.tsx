import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { levelOneConfig } from '../config/levelOne';
import { levelTwoConfig } from '../config/levelTwo';
import { runLevelTwoSimulation, runSimulation } from '../sim/runSimulation';
import { useLevelSession } from './useLevelSession';

describe('useLevelSession', () => {
  it('locks the slider during a run and unlocks it after reset', () => {
    const { result } = renderHook(() => useLevelSession());

    expect(result.current.phase).toBe('editing');
    expect(result.current.isSliderLocked).toBe(false);
    expect(result.current.aValue).toBe(levelOneConfig.slider.initial);

    act(() => {
      result.current.setAValue(0.9);
      result.current.startRun();
    });

    const firstRunId = result.current.activeRunId;

    act(() => {
      result.current.setAValue(1.2);
    });

    expect(result.current.phase).toBe('running');
    expect(result.current.isSliderLocked).toBe(true);
    expect(result.current.attemptCount).toBe(1);
    expect(result.current.aValue).toBe(0.9);

    act(() => {
      result.current.recordOutcome(runSimulation({ a: 0.9 }), firstRunId!);
    });

    expect(result.current.phase).toBe('success');
    expect(result.current.isSliderLocked).toBe(true);

    act(() => {
      result.current.resetRun();
      result.current.setAValue(1.2);
    });

    expect(result.current.phase).toBe('editing');
    expect(result.current.isSliderLocked).toBe(false);
    expect(result.current.aValue).toBe(1.2);
  });

  it('escalates guidance after repeated failed runs', () => {
    const { result } = renderHook(() => useLevelSession());

    act(() => {
      result.current.setAValue(0.2);
      result.current.startRun();
    });

    const firstRunId = result.current.activeRunId;

    act(() => {
      result.current.recordOutcome(runSimulation({ a: 0.2 }), firstRunId!);
    });

    expect(result.current.phase).toBe('failed');
    expect(result.current.feedback.message).toContain('把 a 再调大一点');
    expect(result.current.feedback.detail).toContain('速度积累不起来');
    expect(result.current.attemptCount).toBe(1);

    act(() => {
      result.current.resetRun();
      result.current.setAValue(0.15);
      result.current.startRun();
    });

    const secondRunId = result.current.activeRunId;

    act(() => {
      result.current.recordOutcome(runSimulation({ a: 0.15 }), secondRunId!);
    });

    expect(result.current.phase).toBe('failed');
    expect(result.current.attemptCount).toBe(2);
    expect(result.current.feedback.message).toContain('轨道还是太平了');
    expect(result.current.feedback.detail).toContain('0.45');
    expect(result.current.feedback.detail).toContain('1.05');
  });

  it('ignores repeated startRun calls outside the editing phase', () => {
    const { result } = renderHook(() => useLevelSession());

    act(() => {
      result.current.startRun();
      result.current.startRun();
    });

    expect(result.current.phase).toBe('running');
    expect(result.current.attemptCount).toBe(1);
    expect(result.current.activeRunId).toBe(1);
  });

  it('rejects stale outcomes after reset or after a newer run starts', () => {
    const { result } = renderHook(() => useLevelSession());

    act(() => {
      result.current.startRun();
    });

    const firstRunId = result.current.activeRunId;
    const staleFailure = runSimulation({ a: 0.2 });

    expect(firstRunId).not.toBeNull();

    act(() => {
      result.current.resetRun();
      result.current.recordOutcome(staleFailure, firstRunId as number);
    });

    expect(result.current.phase).toBe('editing');
    expect(result.current.isSliderLocked).toBe(false);
    expect(result.current.lastSimulationResult).toBeNull();
    expect(result.current.attemptCount).toBe(1);

    act(() => {
      result.current.startRun();
    });

    const secondRunId = result.current.activeRunId;
    const successResult = runSimulation({ a: 0.9 });

    expect(secondRunId).not.toBeNull();

    act(() => {
      result.current.recordOutcome(staleFailure, firstRunId as number);
    });

    expect(result.current.phase).toBe('running');
    expect(result.current.activeRunId).toBe(secondRunId);
    expect(result.current.lastSimulationResult).toBeNull();

    act(() => {
      result.current.recordOutcome(successResult, secondRunId as number);
    });

    expect(result.current.phase).toBe('success');
    expect(result.current.lastSimulationResult).toEqual(successResult);
    expect(result.current.attemptCount).toBe(2);
  });

  it('rejects untagged outcomes for an active run', () => {
    const { result } = renderHook(() => useLevelSession());
    const successResult = runSimulation({ a: 0.9 });

    act(() => {
      result.current.startRun();
    });

    act(() => {
      // @ts-expect-error exercising the runtime contract for missing run identity
      result.current.recordOutcome(successResult);
    });

    expect(result.current.phase).toBe('running');
    expect(result.current.activeRunId).toBe(1);
    expect(result.current.lastSimulationResult).toBeNull();

    act(() => {
      result.current.recordOutcome(successResult, result.current.activeRunId!);
    });

    expect(result.current.phase).toBe('success');
    expect(result.current.lastSimulationResult).toEqual(successResult);
  });

  it('enters level two only when requested after level-one success', () => {
    const { result } = renderHook(() => useLevelSession());

    expect(result.current.activeLevel).toBe('level-one');
    expect(result.current.canEnterLevelTwo).toBe(false);

    act(() => {
      result.current.setAValue(0.9);
      result.current.startRun();
    });

    const levelOneRunId = result.current.activeRunId;

    act(() => {
      result.current.recordOutcome(runSimulation({ a: 0.9 }), levelOneRunId!);
    });

    expect(result.current.activeLevel).toBe('level-one');
    expect(result.current.phase).toBe('success');
    expect(result.current.canEnterLevelTwo).toBe(true);

    act(() => {
      result.current.enterLevelTwo();
    });

    expect(result.current.activeLevel).toBe('level-two');
    expect(result.current.phase).toBe('editing');
    expect(result.current.attemptCount).toBe(0);
    expect(result.current.lastSimulationResult).toBeNull();
    expect(result.current.levelTwoParameters).toEqual({
      a: levelTwoConfig.sliders.a.initial,
      h: levelTwoConfig.sliders.h.initial,
      k: levelTwoConfig.sliders.k.initial,
    });
  });

  it('tracks level-two outcomes separately from level one', () => {
    const { result } = renderHook(() => useLevelSession());

    act(() => {
      result.current.setAValue(0.9);
      result.current.startRun();
    });

    const levelOneRunId = result.current.activeRunId;

    act(() => {
      result.current.recordOutcome(runSimulation({ a: 0.9 }), levelOneRunId!);
      result.current.enterLevelTwo();
      result.current.setLevelTwoParameter('a', levelTwoConfig.targetParameters.a);
      result.current.setLevelTwoParameter('h', levelTwoConfig.targetParameters.h);
      result.current.setLevelTwoParameter('k', levelTwoConfig.targetParameters.k);
      result.current.startRun();
    });

    const levelTwoRunId = result.current.activeRunId;

    act(() => {
      result.current.recordOutcome(
        runLevelTwoSimulation(levelTwoConfig.targetParameters),
        levelTwoRunId!,
      );
    });

    expect(result.current.activeLevel).toBe('level-two');
    expect(result.current.phase).toBe('success');
    expect(result.current.attemptCount).toBe(1);
    expect(result.current.lastSimulationResult?.levelId).toBe('level-two');
  });
});

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { levelOneConfig } from '../config/levelOne';
import { runSimulation } from '../sim/runSimulation';
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
    expect(result.current.feedback.message).toContain('Increase a a bit');
    expect(result.current.feedback.detail).toContain('more height');
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
    expect(result.current.feedback.message).toContain('still too flat');
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

    act(() => {
      result.current.resetRun();
      result.current.recordOutcome(staleFailure, firstRunId);
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

    act(() => {
      result.current.recordOutcome(staleFailure, firstRunId);
    });

    expect(result.current.phase).toBe('running');
    expect(result.current.activeRunId).toBe(secondRunId);
    expect(result.current.lastSimulationResult).toBeNull();

    act(() => {
      result.current.recordOutcome(successResult, secondRunId);
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
});

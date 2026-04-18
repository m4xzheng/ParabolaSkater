import { useState } from 'react';

import { levelOneConfig } from '../config/levelOne';
import type { SimulationResult } from '../sim/types';
import { deriveFeedback, type SessionPhase } from './feedback';

type LevelSessionState = {
  aValue: number;
  phase: SessionPhase;
  attemptCount: number;
  failureCount: number;
  lastSimulationResult: SimulationResult | null;
  isSliderLocked: boolean;
};

type LevelSessionApi = {
  aValue: number;
  phase: SessionPhase;
  attemptCount: number;
  lastSimulationResult: SimulationResult | null;
  isSliderLocked: boolean;
  feedback: ReturnType<typeof deriveFeedback>;
  setAValue: (nextValue: number) => void;
  startRun: () => void;
  recordOutcome: (result: SimulationResult) => void;
  resetRun: () => void;
};

const initialState: LevelSessionState = {
  aValue: levelOneConfig.slider.initial,
  phase: 'editing',
  attemptCount: 0,
  failureCount: 0,
  lastSimulationResult: null,
  isSliderLocked: false,
};

export function useLevelSession(): LevelSessionApi {
  const [state, setState] = useState<LevelSessionState>(initialState);

  const feedback = deriveFeedback({
    phase: state.phase,
    lastResult: state.lastSimulationResult,
    failureCount: state.failureCount,
  });

  function setAValue(nextValue: number): void {
    setState((currentState) => {
      if (currentState.isSliderLocked) {
        return currentState;
      }

      return {
        ...currentState,
        aValue: nextValue,
      };
    });
  }

  function startRun(): void {
    setState((currentState) => ({
      ...currentState,
      phase: 'running',
      attemptCount: currentState.attemptCount + 1,
      isSliderLocked: true,
    }));
  }

  function recordOutcome(result: SimulationResult): void {
    setState((currentState) => ({
      ...currentState,
      phase: result.outcome === 'success' ? 'success' : 'failed',
      failureCount:
        result.outcome === 'success'
          ? currentState.failureCount
          : currentState.failureCount + 1,
      lastSimulationResult: result,
      isSliderLocked: true,
    }));
  }

  function resetRun(): void {
    setState((currentState) => ({
      ...currentState,
      phase: 'editing',
      lastSimulationResult: null,
      isSliderLocked: false,
    }));
  }

  return {
    aValue: state.aValue,
    phase: state.phase,
    attemptCount: state.attemptCount,
    lastSimulationResult: state.lastSimulationResult,
    isSliderLocked: state.isSliderLocked,
    feedback,
    setAValue,
    startRun,
    recordOutcome,
    resetRun,
  };
}

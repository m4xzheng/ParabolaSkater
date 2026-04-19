import { useState } from 'react';

import { levelOneConfig } from '../config/levelOne';
import { levelTwoConfig } from '../config/levelTwo';
import type {
  LevelId,
  LevelTwoParameters,
  SimulationResult,
} from '../sim/types';
import { deriveFeedback, type SessionPhase } from './feedback';

type PerLevelRunState = {
  phase: SessionPhase;
  attemptCount: number;
  failureCount: number;
  activeRunId: number | null;
  nextRunId: number;
  lastSimulationResult: SimulationResult | null;
  isSliderLocked: boolean;
};

type LevelSessionState = {
  activeLevel: LevelId;
  levelOneAValue: number;
  levelTwoParameters: LevelTwoParameters;
  levelOne: PerLevelRunState;
  levelTwo: PerLevelRunState;
  canEnterLevelTwo: boolean;
};

type LevelSessionApi = {
  activeLevel: LevelId;
  aValue: number;
  levelTwoParameters: LevelTwoParameters;
  canEnterLevelTwo: boolean;
  phase: SessionPhase;
  attemptCount: number;
  activeRunId: number | null;
  lastSimulationResult: SimulationResult | null;
  isSliderLocked: boolean;
  feedback: ReturnType<typeof deriveFeedback>;
  setAValue: (nextValue: number) => void;
  setLevelTwoParameter: (
    name: keyof LevelTwoParameters,
    nextValue: number,
  ) => void;
  enterLevelTwo: () => void;
  startRun: () => void;
  recordOutcome: (result: SimulationResult, runId: number) => void;
  resetRun: () => void;
};

function createInitialRunState(): PerLevelRunState {
  return {
    phase: 'editing',
    attemptCount: 0,
    failureCount: 0,
    activeRunId: null,
    nextRunId: 1,
    lastSimulationResult: null,
    isSliderLocked: false,
  };
}

function createInitialLevelTwoParameters(): LevelTwoParameters {
  return {
    a: levelTwoConfig.sliders.a.initial,
    h: levelTwoConfig.sliders.h.initial,
    k: levelTwoConfig.sliders.k.initial,
  };
}

const initialState: LevelSessionState = {
  activeLevel: 'level-one',
  levelOneAValue: levelOneConfig.slider.initial,
  levelTwoParameters: createInitialLevelTwoParameters(),
  levelOne: createInitialRunState(),
  levelTwo: createInitialRunState(),
  canEnterLevelTwo: false,
};

function getActiveRunState(currentState: LevelSessionState): PerLevelRunState {
  return currentState.activeLevel === 'level-one'
    ? currentState.levelOne
    : currentState.levelTwo;
}

function updateActiveRunState(
  currentState: LevelSessionState,
  updater: (runState: PerLevelRunState) => PerLevelRunState,
): LevelSessionState {
  if (currentState.activeLevel === 'level-one') {
    return {
      ...currentState,
      levelOne: updater(currentState.levelOne),
    };
  }

  return {
    ...currentState,
    levelTwo: updater(currentState.levelTwo),
  };
}

export function useLevelSession(): LevelSessionApi {
  const [state, setState] = useState<LevelSessionState>(initialState);
  const activeRunState = getActiveRunState(state);

  const feedbackInput = {
    activeLevel: state.activeLevel,
    phase: activeRunState.phase,
    lastResult: activeRunState.lastSimulationResult,
    failureCount: activeRunState.failureCount,
  };
  const feedback = deriveFeedback(feedbackInput);

  function setAValue(nextValue: number): void {
    setState((currentState) => {
      if (currentState.activeLevel !== 'level-one') {
        return currentState;
      }

      if (currentState.levelOne.isSliderLocked) {
        return currentState;
      }

      return {
        ...currentState,
        levelOneAValue: nextValue,
      };
    });
  }

  function setLevelTwoParameter(
    name: keyof LevelTwoParameters,
    nextValue: number,
  ): void {
    setState((currentState) => {
      if (currentState.activeLevel !== 'level-two') {
        return currentState;
      }

      if (currentState.levelTwo.isSliderLocked) {
        return currentState;
      }

      return {
        ...currentState,
        levelTwoParameters: {
          ...currentState.levelTwoParameters,
          [name]: nextValue,
        },
      };
    });
  }

  function enterLevelTwo(): void {
    setState((currentState) => {
      if (!currentState.canEnterLevelTwo) {
        return currentState;
      }

      return {
        ...currentState,
        activeLevel: 'level-two',
        levelTwoParameters: createInitialLevelTwoParameters(),
        levelTwo: createInitialRunState(),
      };
    });
  }

  function startRun(): void {
    setState((currentState) => {
      const activeRunState = getActiveRunState(currentState);

      if (activeRunState.phase !== 'editing') {
        return currentState;
      }

      return updateActiveRunState(currentState, (runState) => ({
        ...runState,
        phase: 'running',
        attemptCount: runState.attemptCount + 1,
        activeRunId: runState.nextRunId,
        nextRunId: runState.nextRunId + 1,
        isSliderLocked: true,
      }));
    });
  }

  function recordOutcome(result: SimulationResult, runId: number): void {
    setState((currentState) => {
      const activeRunState = getActiveRunState(currentState);

      if (activeRunState.phase !== 'running') {
        return currentState;
      }

      if (runId !== activeRunState.activeRunId) {
        return currentState;
      }

      if (result.levelId !== currentState.activeLevel) {
        return currentState;
      }

      const nextState = updateActiveRunState(currentState, (runState) => ({
        ...runState,
        phase: result.outcome === 'success' ? 'success' : 'failed',
        failureCount:
          result.outcome === 'success'
            ? runState.failureCount
            : runState.failureCount + 1,
        activeRunId: null,
        lastSimulationResult: result,
        isSliderLocked: true,
      }));

      if (
        currentState.activeLevel === 'level-one' &&
        result.levelId === 'level-one' &&
        result.outcome === 'success'
      ) {
        return {
          ...nextState,
          canEnterLevelTwo: true,
        };
      }

      return nextState;
    });
  }

  function resetRun(): void {
    setState((currentState) =>
      updateActiveRunState(currentState, (runState) => ({
        ...runState,
        phase: 'editing',
        activeRunId: null,
        lastSimulationResult: null,
        isSliderLocked: false,
      })),
    );
  }

  return {
    activeLevel: state.activeLevel,
    aValue: state.levelOneAValue,
    levelTwoParameters: state.levelTwoParameters,
    canEnterLevelTwo: state.canEnterLevelTwo,
    phase: activeRunState.phase,
    attemptCount: activeRunState.attemptCount,
    activeRunId: activeRunState.activeRunId,
    lastSimulationResult: activeRunState.lastSimulationResult,
    isSliderLocked: activeRunState.isSliderLocked,
    feedback,
    setAValue,
    setLevelTwoParameter,
    enterLevelTwo,
    startRun,
    recordOutcome,
    resetRun,
  };
}

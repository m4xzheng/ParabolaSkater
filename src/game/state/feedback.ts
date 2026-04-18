import { levelOneConfig } from '../config/levelOne';
import type { RunOutcome, SimulationResult } from '../sim/types';

export type SessionPhase = 'editing' | 'running' | 'failed' | 'success';

export type SessionFeedback = {
  message: string;
  detail: string;
};

type OutcomeFeedbackRule = {
  initial: SessionFeedback;
  escalated: SessionFeedback;
};

const successRange = `${levelOneConfig.thresholds.success.min.toFixed(2)} to ${levelOneConfig.thresholds.success.max.toFixed(2)}`;

const outcomeFeedbackRules: Record<Exclude<RunOutcome, 'success'>, OutcomeFeedbackRule> =
  {
    'opens-down': {
      initial: {
        message: 'The parabola opens downward.',
        detail: 'Try a positive a so the track opens upward into a valley.',
      },
      escalated: {
        message: 'The parabola still opens downward.',
        detail:
          'Move a above 0 before your next run so the track becomes an upward-opening valley.',
      },
    },
    'too-flat': {
      initial: {
        message: 'Increase a a bit.',
        detail: 'This track needs a deeper dip before it can carry enough speed.',
      },
      escalated: {
        message: 'The track is still too flat.',
        detail: `Aim for an a value between ${successRange} to deepen the track.`,
      },
    },
    'too-steep': {
      initial: {
        message: 'Lower a a little.',
        detail: 'This track gets narrow too quickly and becomes hard to ride.',
      },
      escalated: {
        message: 'The track is still too steep.',
        detail: `Bring a back toward the ${successRange} range for a smoother ride.`,
      },
    },
  };

export function deriveFeedback(input: {
  phase: SessionPhase;
  lastResult: SimulationResult | null;
  failureCount: number;
}): SessionFeedback {
  if (input.phase === 'running') {
    return {
      message: 'Running the track...',
      detail: 'Hold this value while the simulation plays.',
    };
  }

  if (input.phase === 'success' && input.lastResult !== null) {
    return {
      message: 'Nice work: that track carries the skater across.',
      detail: input.lastResult.summary,
    };
  }

  if (
    input.phase === 'failed' &&
    input.lastResult !== null &&
    input.lastResult.outcome !== 'success'
  ) {
    const feedbackRule = outcomeFeedbackRules[input.lastResult.outcome];
    return input.failureCount > 1 ? feedbackRule.escalated : feedbackRule.initial;
  }

  return {
    message: 'Adjust a to shape the track.',
    detail: `Look for a value between ${successRange} when you are ready to test.`,
  };
}

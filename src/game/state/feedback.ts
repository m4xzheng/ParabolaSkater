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

const successRange = `${levelOneConfig.thresholds.success.min.toFixed(2)} 到 ${levelOneConfig.thresholds.success.max.toFixed(2)}`;

const outcomeFeedbackRules: Record<Exclude<RunOutcome, 'success'>, OutcomeFeedbackRule> = {
  'opens-down': {
    initial: {
      message: '抛物线开口朝下。',
      detail: '滑手会在中途失去支撑，没法稳稳滑到终点平台。',
    },
    escalated: {
      message: '抛物线还是开口朝下。',
      detail: '先让 a 大于 0，滑道才会变成能托住滑手的谷底。',
    },
  },
  'too-flat': {
    initial: {
      message: '把 a 再调大一点。',
      detail: '这条轨道下坠还不够，速度积累不起来。',
    },
    escalated: {
      message: '轨道还是太平了。',
      detail: `试着把 a 调到 ${successRange} 之间，让轨道更有下坠感。`,
    },
  },
  'too-steep': {
    initial: {
      message: '把 a 再调小一点。',
      detail: '滑道收得太急，滑手会在靠近终点前失控。',
    },
    escalated: {
      message: '轨道还是太陡了。',
      detail: `把 a 往 ${successRange} 这一段拉回一点，滑行会更平稳。`,
    },
  },
  'misses-track': {
    initial: {
      message: '起跳后没有接到滑道。',
      detail: '这条抛物线已经抬得太高，滑手会直接从平台边缘掉下去。',
    },
    escalated: {
      message: '滑道还是太高了。',
      detail: '把 a 再调小一些，让起点附近的抛物线落回平台下方，滑手才能接轨。',
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
      message: '正在观察这一趟滑行……',
      detail: '先让滑手完整跑完这一条路线，再判断这条滑道到底行不行。',
    };
  }

  if (input.phase === 'success' && input.lastResult !== null) {
    return {
      message: '这条轨道能把小滑手稳稳送到对面。',
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
    message: '先调一调 a，再按“开始滑行”。',
    detail: `这条滑道是抛物线 y = ax²。现在平台位置固定不动，滑手要先从起点平台落到抛物线上，再一路滑向终点平台。`,
  };
}

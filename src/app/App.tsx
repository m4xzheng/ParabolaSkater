import { useEffect, useRef, useState } from 'react';

import '../styles/app.css';
import { levelTwoConfig } from '../game/config/levelTwo';
import { runLevelTwoSimulation, runSimulation } from '../game/sim/runSimulation';
import type { LevelId, SimulationResult } from '../game/sim/types';
import { useLevelSession } from '../game/state/useLevelSession';
import { ControlPanel } from '../game/ui/ControlPanel';
import { FeedbackPanel } from '../game/ui/FeedbackPanel';
import { GameCanvas } from '../game/ui/GameCanvas';
import { StatusBanner } from '../game/ui/StatusBanner';

const PLAYBACK_DURATION_MS = 3000;
const PLAYBACK_TICK_MS = 50;

type FailedRunsByLevel = Record<LevelId, SimulationResult[]>;
type GhostVisibilityByLevel = Record<LevelId, boolean>;

const initialFailedRuns: FailedRunsByLevel = {
  'level-one': [],
  'level-two': [],
};

const initialGhostVisibility: GhostVisibilityByLevel = {
  'level-one': true,
  'level-two': true,
};

export default function App(): JSX.Element {
  const session = useLevelSession();
  const {
    activeLevel,
    aValue,
    activeRunId,
    attemptCount,
    canEnterLevelTwo,
    enterLevelTwo,
    feedback,
    isSliderLocked,
    lastSimulationResult,
    levelTwoParameters,
    phase,
    recordOutcome,
    resetRun,
    setAValue,
    setLevelTwoParameter,
    startRun,
  } = session;

  const [failedRunsByLevel, setFailedRunsByLevel] =
    useState<FailedRunsByLevel>(initialFailedRuns);
  const [showGhostTrailsByLevel, setShowGhostTrailsByLevel] =
    useState<GhostVisibilityByLevel>(initialGhostVisibility);
  const [activePlaybackResult, setActivePlaybackResult] =
    useState<SimulationResult | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const recordedResultRef = useRef<SimulationResult | null>(null);
  const recordOutcomeRef = useRef(recordOutcome);

  useEffect(() => {
    recordOutcomeRef.current = recordOutcome;
  }, [recordOutcome]);

  useEffect(() => {
    if (phase !== 'running' || activeRunId === null) {
      return;
    }

    const result =
      activeLevel === 'level-one'
        ? runSimulation({ a: aValue })
        : runLevelTwoSimulation(levelTwoParameters);

    setActivePlaybackResult(result);
    setPlaybackProgress(0);

    let elapsed = 0;

    const intervalId = window.setInterval(() => {
      elapsed += PLAYBACK_TICK_MS;
      const nextProgress = Math.min(elapsed / PLAYBACK_DURATION_MS, 1);

      setPlaybackProgress(nextProgress);

      if (nextProgress >= 1) {
        window.clearInterval(intervalId);
        recordOutcomeRef.current(result, activeRunId);
      }
    }, PLAYBACK_TICK_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [aValue, activeLevel, activeRunId, levelTwoParameters, phase]);

  useEffect(() => {
    if (
      lastSimulationResult === null ||
      lastSimulationResult === recordedResultRef.current
    ) {
      return;
    }

    recordedResultRef.current = lastSimulationResult;

    if (lastSimulationResult.outcome === 'success') {
      return;
    }

    setFailedRunsByLevel((currentRuns) => ({
      ...currentRuns,
      [lastSimulationResult.levelId]: [
        ...currentRuns[lastSimulationResult.levelId],
        lastSimulationResult,
      ],
    }));
    setShowGhostTrailsByLevel((currentVisibility) => ({
      ...currentVisibility,
      [lastSimulationResult.levelId]: true,
    }));
  }, [lastSimulationResult]);

  function handleReset(): void {
    setActivePlaybackResult(null);
    setPlaybackProgress(0);
    resetRun();
  }

  const failedRuns = failedRunsByLevel[activeLevel];
  const showGhostTrails = showGhostTrailsByLevel[activeLevel];
  const visibleSimulationResult =
    phase === 'running' ? activePlaybackResult : lastSimulationResult;
  const shouldShowReview =
    (phase === 'failed' || phase === 'success') && lastSimulationResult !== null;
  const reviewTone = phase === 'success' ? 'success' : 'failed';
  const missionEyebrow =
    activeLevel === 'level-one' ? '山谷训练场' : levelTwoConfig.mission.eyebrow;
  const missionTitle =
    activeLevel === 'level-one' ? '把滑手送到右侧平台' : levelTwoConfig.mission.title;
  const reviewChip =
    activeLevel === 'level-one'
      ? `a = ${aValue.toFixed(2)}`
      : `a = ${levelTwoParameters.a.toFixed(2)} | h = ${levelTwoParameters.h.toFixed(2)} | k = ${levelTwoParameters.k.toFixed(2)}`;
  const successReviewDetail =
    activeLevel === 'level-one'
      ? '你已经找到能跨过缺口的 a 值，可以准备进入下一步学习。'
      : '这条顶点式轨道已经和目标圆、左右平台都对齐了。';
  const showLevelTwoEntry = activeLevel === 'level-one' && canEnterLevelTwo;

  return (
    <main className="app-shell">
      <section className="game-view" aria-label="游戏视图">
        <section className="mission-brief" aria-labelledby="mission-brief-title">
          <p className="eyebrow">{missionEyebrow}</p>
          <h2 id="mission-brief-title">{missionTitle}</h2>
          <p className="mission-brief-copy">
            {activeLevel === 'level-one' ? (
              <>
                这条滑道是一条抛物线 <code>y = ax²</code>。你要把它调成一条能顺利滑过去的谷底滑道。
              </>
            ) : (
              <>
                这一关使用 <code>y = a(x - h)^2 + k</code>。先用 <code>h</code> 和{' '}
                <code>k</code> 移动顶点，再用 <code>a</code> 调整开口和坡度。
              </>
            )}
          </p>
          <p className="mission-brief-formula">
            {activeLevel === 'level-one' ? (
              <>
                <code>a</code> 决定开口方向和弯曲程度，<code>a &gt; 0</code> 时向上开口，
                <code>|a|</code> 越大，轨道越陡。
              </>
            ) : (
              <>
                <code>h</code> 和 <code>k</code> 负责移动顶点，<code>a</code>{' '}
                负责调整开口和坡度。先把顶点送进目标圆，再检查左右平台是否接轨。
              </>
            )}
          </p>
        </section>

        <GameCanvas
          activeLevel={activeLevel}
          aValue={activeLevel === 'level-one' ? aValue : levelTwoParameters.a}
          levelTwoParameters={levelTwoParameters}
          ghostResults={showGhostTrails ? failedRuns : []}
          playbackProgress={
            phase === 'running' ? playbackProgress : lastSimulationResult === null ? 0 : 1
          }
          phase={phase}
          showGhostTrails={showGhostTrails}
          simulationResult={visibleSimulationResult}
        />
      </section>

      <aside className="teaching-panel" aria-label="教学面板">
        <StatusBanner phase={phase} attemptCount={attemptCount} />
        <ControlPanel
          activeLevel={activeLevel}
          aValue={aValue}
          levelTwoParameters={levelTwoParameters}
          isSliderLocked={isSliderLocked}
          phase={phase}
          onAValueChange={setAValue}
          onLevelTwoParameterChange={setLevelTwoParameter}
          onRun={startRun}
          onReset={handleReset}
        />
        <FeedbackPanel feedback={feedback} />

        {showLevelTwoEntry ? (
          <div className="level-entry-row">
            <button type="button" className="level-entry-button" onClick={enterLevelTwo}>
              进入第二关
            </button>
          </div>
        ) : null}

        {shouldShowReview ? (
          <section
            className={`teaching-card run-review-panel run-review-panel--${reviewTone}`}
            aria-label="本轮复盘"
          >
            <p className="eyebrow">结果复盘</p>
            <div className="run-review-header">
              <h2>{phase === 'success' ? '挑战成功' : `第 ${attemptCount} 次尝试`}</h2>
              <span className="run-review-chip">{reviewChip}</span>
            </div>

            <p className="run-review-summary">
              {phase === 'success' ? lastSimulationResult.summary : feedback.message}
            </p>
            <p className="run-review-detail">
              {phase === 'success' ? successReviewDetail : feedback.detail}
            </p>

            {failedRuns.length > 0 ? (
              <div className="ghost-toggle-row">
                <label className="ghost-toggle">
                  <input
                    type="checkbox"
                    checked={showGhostTrails}
                    onChange={() =>
                      setShowGhostTrailsByLevel((currentVisibility) => ({
                        ...currentVisibility,
                        [activeLevel]: !currentVisibility[activeLevel],
                      }))
                    }
                  />
                  <span>显示失败轨迹参考线</span>
                </label>
                <p className="ghost-toggle-copy">
                  {`已记录 ${failedRuns.length} 次失败轨迹，可对照观察。`}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}
      </aside>
    </main>
  );
}

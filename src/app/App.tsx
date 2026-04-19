import { useEffect, useRef, useState } from 'react';

import '../styles/app.css';
import { runSimulation } from '../game/sim/runSimulation';
import type { SimulationResult } from '../game/sim/types';
import { useLevelSession } from '../game/state/useLevelSession';
import { GameCanvas } from '../game/ui/GameCanvas';
import { ControlPanel } from '../game/ui/ControlPanel';
import { FeedbackPanel } from '../game/ui/FeedbackPanel';
import { StatusBanner } from '../game/ui/StatusBanner';

const PLAYBACK_DURATION_MS = 3000;
const PLAYBACK_TICK_MS = 50;

export default function App(): JSX.Element {
  const session = useLevelSession();
  const {
    aValue,
    activeRunId,
    attemptCount,
    feedback,
    isSliderLocked,
    lastSimulationResult,
    phase,
    recordOutcome,
    resetRun,
    setAValue,
    startRun,
  } = session;

  const [failedRuns, setFailedRuns] = useState<SimulationResult[]>([]);
  const [showGhostTrails, setShowGhostTrails] = useState(true);
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

    const result = runSimulation({ a: aValue });
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
  }, [aValue, activeRunId, phase]);

  useEffect(() => {
    if (lastSimulationResult === null || lastSimulationResult === recordedResultRef.current) {
      return;
    }

    recordedResultRef.current = lastSimulationResult;

    if (lastSimulationResult.outcome === 'success') {
      return;
    }

    setFailedRuns((currentRuns) => [...currentRuns, lastSimulationResult]);
    setShowGhostTrails(true);
  }, [lastSimulationResult]);

  function handleReset(): void {
    setActivePlaybackResult(null);
    setPlaybackProgress(0);
    resetRun();
  }

  const visibleSimulationResult =
    phase === 'running' ? activePlaybackResult : lastSimulationResult;
  const shouldShowReview =
    (phase === 'failed' || phase === 'success') && lastSimulationResult !== null;
  const reviewTone = phase === 'success' ? 'success' : 'failed';

  return (
    <main className="app-shell">
      <section className="game-view" aria-label="游戏视图">
        <section className="mission-brief" aria-labelledby="mission-brief-title">
          <p className="eyebrow">山谷训练场</p>
          <h2 id="mission-brief-title">把滑手送到右侧平台</h2>
          <p className="mission-brief-copy">
            这条滑道是一条抛物线 <code>y = ax²</code>。你要把它调成一条能顺利滑过去的谷底滑道。
          </p>
          <p className="mission-brief-formula">
            <code>a</code> 决定开口方向和弯曲程度：<code>a &gt; 0</code> 时向上开口，<code>|a|</code>{' '}
            越大，轨道越陡。
          </p>
        </section>

        <GameCanvas
          aValue={aValue}
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
          aValue={aValue}
          isSliderLocked={isSliderLocked}
          phase={phase}
          onAValueChange={setAValue}
          onRun={startRun}
          onReset={handleReset}
        />
        <FeedbackPanel feedback={feedback} />

        {shouldShowReview ? (
          <section
            className={`teaching-card run-review-panel run-review-panel--${reviewTone}`}
            aria-label="本轮复盘"
          >
            <p className="eyebrow">结果复盘</p>
            <div className="run-review-header">
              <h2>{phase === 'success' ? '挑战成功' : `第 ${attemptCount} 次尝试`}</h2>
              <span className="run-review-chip">a = {aValue.toFixed(2)}</span>
            </div>

            <p className="run-review-summary">
              {phase === 'success' ? lastSimulationResult.summary : feedback.message}
            </p>
            <p className="run-review-detail">
              {phase === 'success'
                ? '你已经找到能跨过缺口的 a 值，可以准备进入下一步学习。'
                : feedback.detail}
            </p>

            {failedRuns.length > 0 ? (
              <div className="ghost-toggle-row">
                <label className="ghost-toggle">
                  <input
                    type="checkbox"
                    checked={showGhostTrails}
                    onChange={() => setShowGhostTrails((currentValue) => !currentValue)}
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

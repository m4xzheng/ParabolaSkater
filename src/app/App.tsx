import { useEffect, useRef, useState } from 'react';

import { runSimulation } from '../game/sim/runSimulation';
import type { SimulationResult } from '../game/sim/types';
import { useLevelSession } from '../game/state/useLevelSession';
import { GameCanvas } from '../game/ui/GameCanvas';
import { ControlPanel } from '../game/ui/ControlPanel';
import { FeedbackPanel } from '../game/ui/FeedbackPanel';
import { StatusBanner } from '../game/ui/StatusBanner';

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
  const recordedResultRef = useRef<SimulationResult | null>(null);

  useEffect(() => {
    if (phase !== 'running' || activeRunId === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      recordOutcome(runSimulation({ a: aValue }), activeRunId);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [aValue, activeRunId, phase, recordOutcome]);

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

  const shouldShowReview = phase === 'failed' || phase === 'success';
  const latestFailedRun = failedRuns[failedRuns.length - 1] ?? null;
  const reviewTone = phase === 'success' ? 'success' : 'failed';

  return (
    <main className="app-shell">
      <section className="game-view" aria-label="Game view">
        <GameCanvas
          aValue={aValue}
          ghostResults={showGhostTrails ? failedRuns : []}
          phase={phase}
          showGhostTrails={showGhostTrails}
          simulationResult={lastSimulationResult}
        />
      </section>

      <aside className="teaching-panel" aria-label="Teaching panel">
        <StatusBanner phase={phase} attemptCount={attemptCount} />
        <ControlPanel
          aValue={aValue}
          isSliderLocked={isSliderLocked}
          phase={phase}
          onAValueChange={setAValue}
          onRun={startRun}
          onReset={resetRun}
        />
        <FeedbackPanel feedback={feedback} />
        {shouldShowReview ? (
          <section
            className={`teaching-card run-review-panel run-review-panel--${reviewTone}`}
            aria-label="Run review"
          >
            <p className="eyebrow">{'\u7ed3\u679c\u590d\u76d8'}</p>
            <div className="run-review-header">
              <h2>{phase === 'success' ? 'Success' : `Run ${attemptCount}`}</h2>
              <span className="run-review-chip">a = {aValue.toFixed(2)}</span>
            </div>

            {phase === 'success' && lastSimulationResult !== null ? (
              <>
                <p className="run-review-summary">{lastSimulationResult.summary}</p>
                <p className="run-review-detail">
                  {'\u4f60\u5df2\u7ecf\u627e\u5230\u80fd\u8de8\u8fc7\u7f3a\u53e3\u7684 a \u503c\uff0c\u53ef\u4ee5\u51c6\u5907\u8fdb\u5165\u4e0b\u4e00\u6b65\u5b66\u4e60\u3002'}
                </p>
              </>
            ) : (
              <>
                <p className="run-review-summary">{feedback.message}</p>
                <p className="run-review-detail">
                  {latestFailedRun?.summary ?? feedback.detail}
                </p>
              </>
            )}

            {failedRuns.length > 0 ? (
              <div className="ghost-toggle-row">
                <label className="ghost-toggle">
                  <input
                    type="checkbox"
                    checked={showGhostTrails}
                    onChange={() => setShowGhostTrails((currentValue) => !currentValue)}
                  />
                  <span>Show failed ghost trails</span>
                </label>
                <p className="ghost-toggle-copy">
                  {`${failedRuns.length} failed ghost trail(s) ready to compare.`}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}
      </aside>
    </main>
  );
}

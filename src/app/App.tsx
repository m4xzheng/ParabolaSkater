import { useEffect } from 'react';

import { runSimulation } from '../game/sim/runSimulation';
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

  useEffect(() => {
    if (phase !== 'running' || activeRunId === null) {
      return;
    }

    recordOutcome(runSimulation({ a: aValue }), activeRunId);
  }, [aValue, activeRunId, phase, recordOutcome]);

  return (
    <main className="app-shell">
      <section className="game-view" aria-label="Game view">
        <GameCanvas aValue={aValue} simulationResult={lastSimulationResult} />
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
      </aside>
    </main>
  );
}

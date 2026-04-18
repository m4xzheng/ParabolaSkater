import type { SessionPhase } from '../state/feedback';

const phaseLabel: Record<SessionPhase, string> = {
  editing: '\u51c6\u5907\u8c03\u53c2',
  running: '\u6b63\u5728\u8fd0\u884c',
  failed: '\u9700\u8981\u518d\u8bd5\u4e00\u6b21',
  success: '\u8fc7\u5173',
};

export function StatusBanner(props: {
  phase: SessionPhase;
  attemptCount: number;
}): JSX.Element {
  return (
    <section className="status-banner" aria-label="Run status">
      <div>
        <p className="status-banner-label">{'\u8bfe\u5802\u8fdb\u5ea6'}</p>
        <strong>{phaseLabel[props.phase]}</strong>
      </div>
      <div>
        <p className="status-banner-label">{'\u5c1d\u8bd5\u6b21\u6570'}</p>
        <strong>{props.attemptCount}</strong>
      </div>
    </section>
  );
}

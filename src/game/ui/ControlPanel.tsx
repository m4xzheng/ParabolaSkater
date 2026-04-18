import { levelOneConfig } from '../config/levelOne';
import type { SessionPhase } from '../state/feedback';

export function ControlPanel(props: {
  aValue: number;
  isSliderLocked: boolean;
  phase: SessionPhase;
  onAValueChange: (nextValue: number) => void;
  onRun: () => void;
  onReset: () => void;
}): JSX.Element {
  const buttonLabel = props.phase === 'editing' || props.phase === 'running' ? 'Go' : 'Try again';

  function handleButtonClick(): void {
    if (props.phase === 'editing') {
      props.onRun();
      return;
    }

    if (props.phase !== 'running') {
      props.onReset();
    }
  }

  return (
    <section className="teaching-card control-panel" aria-labelledby="control-panel-title">
      <p className="eyebrow">Parabola Skater</p>
      <h1 id="control-panel-title">{levelOneConfig.title}</h1>
      <p className="panel-description">
        {'\u8c03\u6574 a \u6765\u6539\u53d8\u629b\u7269\u7ebf\u5f27\u7ebf\u3002'}
      </p>

      <form className="control-form">
        <label htmlFor="parameter-a">{'\u53c2\u6570 a'}</label>
        <output htmlFor="parameter-a" aria-live="polite">
          {props.aValue.toFixed(2)}
        </output>
        <input
          id="parameter-a"
          name="a"
          type="range"
          min={levelOneConfig.slider.min}
          max={levelOneConfig.slider.max}
          step={levelOneConfig.slider.step}
          value={props.aValue}
          disabled={props.isSliderLocked}
          onChange={(event) => props.onAValueChange(Number(event.target.value))}
        />
        <button type="button" disabled={props.phase === 'running'} onClick={handleButtonClick}>
          {buttonLabel}
        </button>
      </form>
    </section>
  );
}

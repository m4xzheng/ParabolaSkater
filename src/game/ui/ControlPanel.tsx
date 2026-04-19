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
  const buttonLabel =
    props.phase === 'editing' || props.phase === 'running' ? '开始滑行' : '重新调整';

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
      <p className="eyebrow">抛物线滑道实验</p>
      <h1 id="control-panel-title">{levelOneConfig.title}</h1>
      <p className="panel-description">
        滑道满足 <code>y = ax²</code>，拖动 <code>a</code> 就是在改变这条抛物线。
      </p>
      <p className="panel-note">
        <code>a</code> 决定开口方向和弯曲程度：<code>a &gt; 0</code> 时向上开口，<code>|a|</code>{' '}
        越大，谷底越深、坡面越陡。
      </p>

      <form className="control-form">
        <label htmlFor="parameter-a">参数 a</label>
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
        <p className="control-hint">目标是让谷底既不太平，也不太陡。</p>
        <button type="button" disabled={props.phase === 'running'} onClick={handleButtonClick}>
          {buttonLabel}
        </button>
      </form>
    </section>
  );
}

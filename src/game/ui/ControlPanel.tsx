import { levelOneConfig } from '../config/levelOne';
import { levelTwoConfig } from '../config/levelTwo';
import type { LevelId, LevelTwoParameters } from '../sim/types';
import type { SessionPhase } from '../state/feedback';

type ControlPanelProps = {
  activeLevel: LevelId;
  aValue: number;
  levelTwoParameters: LevelTwoParameters;
  isSliderLocked: boolean;
  phase: SessionPhase;
  onAValueChange: (nextValue: number) => void;
  onLevelTwoParameterChange: (
    name: keyof LevelTwoParameters,
    nextValue: number,
  ) => void;
  onRun: () => void;
  onReset: () => void;
};

type ParameterControlProps = {
  name: keyof LevelTwoParameters | 'a';
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onChange: (nextValue: number) => void;
};

function renderParameterControl(props: ParameterControlProps): JSX.Element {
  const inputId = `parameter-${props.name}`;

  return (
    <div className="parameter-control">
      <div className="parameter-control-header">
        <label htmlFor={inputId}>{props.label}</label>
        <output htmlFor={inputId} aria-live="polite">
          {props.value.toFixed(2)}
        </output>
      </div>
      <input
        id={inputId}
        name={props.name}
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        disabled={props.disabled}
        onChange={(event) => props.onChange(Number(event.target.value))}
      />
    </div>
  );
}

export function ControlPanel(props: ControlPanelProps): JSX.Element {
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

  const isLevelTwo = props.activeLevel === 'level-two';

  return (
    <section className="teaching-card control-panel" aria-labelledby="control-panel-title">
      <p className="eyebrow">
        {isLevelTwo ? levelTwoConfig.mission.eyebrow : '抛物线滑道实验'}
      </p>
      <h1 id="control-panel-title">
        {isLevelTwo ? levelTwoConfig.title : levelOneConfig.title}
      </h1>
      {isLevelTwo ? (
        <>
          <p className="panel-description">
            <code>y = a(x - h)^2 + k</code>
          </p>
          <p className="panel-note">
            先用 <code>h</code> 和 <code>k</code> 移动顶点，再用 <code>a</code>{' '}
            调整开口和坡度。反馈只会告诉你方向，不会直接给出答案。
          </p>
          <form className="control-form control-form--stacked">
            {renderParameterControl({
              name: 'a',
              label: '参数 a',
              value: props.levelTwoParameters.a,
              min: levelTwoConfig.sliders.a.min,
              max: levelTwoConfig.sliders.a.max,
              step: levelTwoConfig.sliders.a.step,
              disabled: props.isSliderLocked,
              onChange: (nextValue) =>
                props.onLevelTwoParameterChange('a', nextValue),
            })}
            {renderParameterControl({
              name: 'h',
              label: '参数 h',
              value: props.levelTwoParameters.h,
              min: levelTwoConfig.sliders.h.min,
              max: levelTwoConfig.sliders.h.max,
              step: levelTwoConfig.sliders.h.step,
              disabled: props.isSliderLocked,
              onChange: (nextValue) =>
                props.onLevelTwoParameterChange('h', nextValue),
            })}
            {renderParameterControl({
              name: 'k',
              label: '参数 k',
              value: props.levelTwoParameters.k,
              min: levelTwoConfig.sliders.k.min,
              max: levelTwoConfig.sliders.k.max,
              step: levelTwoConfig.sliders.k.step,
              disabled: props.isSliderLocked,
              onChange: (nextValue) =>
                props.onLevelTwoParameterChange('k', nextValue),
            })}
            <p className="control-hint">目标是把顶点移进目标圆，并让左右平台都能接上轨道。</p>
            <button
              type="button"
              disabled={props.phase === 'running'}
              onClick={handleButtonClick}
            >
              {buttonLabel}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="panel-description">
            滑道满足 <code>y = ax²</code>，拖动 <code>a</code> 就是在改变这条抛物线。
          </p>
          <p className="panel-note">
            <code>a</code> 决定开口方向和弯曲程度：<code>a &gt; 0</code>{' '}
            时向上开口，<code>|a|</code> 越大，谷底越深、坡面越陡。
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
            <button
              type="button"
              disabled={props.phase === 'running'}
              onClick={handleButtonClick}
            >
              {buttonLabel}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

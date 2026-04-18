import type { SessionFeedback } from '../state/feedback';

export function FeedbackPanel(props: { feedback: SessionFeedback }): JSX.Element {
  return (
    <section className="teaching-card feedback-panel" aria-labelledby="feedback-panel-title">
      <p className="eyebrow">{'\u6559\u5b66\u53cd\u9988'}</p>
      <h2 id="feedback-panel-title">{props.feedback.message}</h2>
      <p>{props.feedback.detail}</p>
    </section>
  );
}

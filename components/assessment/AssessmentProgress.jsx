// components/assessment/AssessmentProgress.jsx
// "Part X of N" label + single fill progress bar.

export default function AssessmentProgress({ step, totalSteps = 3 }) {
  const pct = Math.min(100, (step / totalSteps) * 100);

  return (
    <div className="assessment-progress">
      <span className="assessment-progress__label">
        Part {step} of {totalSteps}
      </span>
      <div className="assessment-progress__track">
        <div className="assessment-progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
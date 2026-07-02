// components/assessment/RecommendedActionCard.jsx
// Single selectable radio card used in Part 3 (Recommended Action).

export default function RecommendedActionCard({ label, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`assessment-option${selected ? " assessment-option--selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span
        className={`assessment-option__radio${
          selected ? " assessment-option__radio--selected" : ""
        }`}
        aria-hidden="true"
      />
      <span className="assessment-option__label">{label}</span>
    </button>
  );
}
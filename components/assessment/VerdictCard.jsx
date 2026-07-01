// components/assessment/VerdictCard.jsx
// Form B Part 3 verdict selector. Same interaction shape as
// RecommendedActionCard (radio-card, `selected`, `onSelect`) — literally
// extends .assessment-option — plus a color chip and a two-line label
// (verdict name + short description).
//
// Colors reuse the hex values already defined for StatusBadge in
// styles/badges.css (--verified green / --pending amber / --unsafe red)
// so no new palette is introduced.
//
// Props: label, description, color ("green" | "amber" | "red"), selected, onSelect

const COLOR_CLASS = {
  green: "verdict-card__chip--green",
  amber: "verdict-card__chip--amber",
  red: "verdict-card__chip--red",
};

export default function VerdictCard({ label, description, color, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`assessment-option verdict-card${
        selected ? " assessment-option--selected" : ""
      }`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span
        className={`assessment-option__radio${
          selected ? " assessment-option__radio--selected" : ""
        }`}
        aria-hidden="true"
      />
      <span className={`verdict-card__chip ${COLOR_CLASS[color] ?? ""}`} aria-hidden="true" />
      <span className="verdict-card__text">
        <span className="assessment-option__label">{label}</span>
        <span className="verdict-card__description">{description}</span>
      </span>
    </button>
  );
}

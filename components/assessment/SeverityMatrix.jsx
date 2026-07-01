// components/assessment/SeverityMatrix.jsx
// Condition Observed x None/Minor/Moderate/Severe radio grid.
// Replaces the plain FormField rows previously used for Form A Part 2
// crack severity, and is reused as-is for Form B Part 2 structural
// damage assessment — one component backs both forms.
//
// Props:
//   rows:     [{ id, label }]
//   value:    Record<id, "none" | "minor" | "moderate" | "severe">
//   onChange: (id, severity) => void
//
// Usage:
//   <SeverityMatrix
//     rows={[{ id: "cracking", label: "Visible structural cracking" }]}
//     value={form.damage}
//     onChange={(id, severity) =>
//       setForm((prev) => ({ ...prev, damage: { ...prev.damage, [id]: severity } }))
//     }
//   />

const LEVELS = [
  { key: "none", label: "None" },
  { key: "minor", label: "Minor" },
  { key: "moderate", label: "Moderate" },
  { key: "severe", label: "Severe" },
];

export default function SeverityMatrix({ rows = [], value = {}, onChange }) {
  return (
    <div className="severity-matrix">
      <div className="severity-matrix__header">
        <span className="severity-matrix__header-label" />
        {LEVELS.map((level) => (
          <span key={level.key} className="severity-matrix__header-cell">
            {level.label}
          </span>
        ))}
      </div>

      {rows.map((row) => (
        <div key={row.id} className="severity-matrix__row">
          <span className="severity-matrix__row-label">{row.label}</span>
          {LEVELS.map((level) => {
            const selected = value[row.id] === level.key;
            return (
              <button
                key={level.key}
                type="button"
                className="severity-matrix__cell"
                aria-label={`${row.label}: ${level.label}`}
                aria-pressed={selected}
                onClick={() => onChange?.(row.id, level.key)}
              >
                <span
                  className={`severity-matrix__radio${
                    selected ? " severity-matrix__radio--selected" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

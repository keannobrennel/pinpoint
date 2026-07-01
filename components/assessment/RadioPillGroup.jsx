// components/assessment/RadioPillGroup.jsx
// Single-select pill row — reuses the existing .filter-bar__pill visual
// language so the wizard doesn't invent a new control style.
// Used for: Previous Posting, Areas Inspected (Form B Part 1).
//
// Usage:
//   <RadioPillGroup
//     options={[{ key: "none", label: "None" }, { key: "green", label: "Green" }]}
//     value={form.previousPosting}
//     onChange={updateField("previousPosting")}
//   />

export default function RadioPillGroup({ options = [], value, onChange }) {
  return (
    <div className="radio-pill-group">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          className={`filter-bar__pill${
            value === option.key ? " filter-bar__pill--active" : ""
          }`}
          aria-pressed={value === option.key}
          onClick={() => onChange?.(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

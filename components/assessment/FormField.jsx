// components/assessment/FormField.jsx
// Labeled input/textarea used throughout the assessment wizard.
// Pass `readOnly` for auto-filled fields (Screening Engineer, PRC License)
// that render as plain bold text with no input box, matching the design.

export default function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  readOnly = false,
  rows = 3,
}) {
  if (readOnly) {
    return (
      <div className="assessment-field">
        <span className="assessment-field__label">{label}</span>
        <p className="assessment-field__static">{value}</p>
      </div>
    );
  }

  return (
    <div className="assessment-field">
      <span className="assessment-field__label">
        {label}
        {hint && <span className="assessment-field__hint"> {hint}</span>}
      </span>

      {type === "textarea" ? (
        <textarea
          className="assessment-field__textarea"
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className="assessment-field__input"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )}
    </div>
  );
}
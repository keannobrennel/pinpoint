// components/assessment/CheckboxGroup.jsx
// Multi-select pill row — same visual language as RadioPillGroup /
// .filter-bar__pill, but each pill toggles independently instead of
// single-select. Supports an optional "Other: ___" free-text option,
// seen throughout the reference form (Facility Type, Further Actions).
//
// Usage:
//   <CheckboxGroup
//     options={[{ key: "school", label: "School" }, { key: "other", label: "Other" }]}
//     value={form.facilityType}
//     onChange={updateField("facilityType")}
//     otherValue={form.facilityTypeOther}
//     onOtherChange={updateField("facilityTypeOther")}
//   />

export default function CheckboxGroup({
  options = [],
  value = [],
  onChange,
  otherValue,
  onOtherChange,
}) {
  const toggle = (key) => {
    const next = value.includes(key)
      ? value.filter((k) => k !== key)
      : [...value, key];
    onChange?.(next);
  };

  const hasOtherOption = options.some((o) => o.key === "other");

  return (
    <div className="checkbox-group">
      <div className="checkbox-group__pills">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`filter-bar__pill${
              value.includes(option.key) ? " filter-bar__pill--active" : ""
            }`}
            aria-pressed={value.includes(option.key)}
            onClick={() => toggle(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {hasOtherOption && value.includes("other") && (
        <input
          type="text"
          className="assessment-field__input checkbox-group__other-input"
          placeholder="Please specify"
          value={otherValue ?? ""}
          onChange={(e) => onOtherChange?.(e.target.value)}
        />
      )}
    </div>
  );
}

"use client";

// Shared tab pill filter bar.
// Each page controls its own tabs and active state —
// this component only handles rendering and click events.
//
// Usage:
//   const [active, setActive] = useState("all");
//   <FilterBar tabs={[
//     { key: "all", label: "All" },
//     { key: "pre", label: "Pre-disaster" },
//     { key: "post", label: "Post-disaster" },
//   ]} active={active} onChange={setActive} />

export default function FilterBar({ tabs = [], active, onChange }) {
  return (
    <div className="filter-bar">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`filter-bar__pill${active === tab.key ? " filter-bar__pill--active" : ""}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
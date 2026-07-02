"use client";

import { useState } from "react";
import FilterBar from "@/components/ui/FilterBar";

// Shared shell for list-style pages: Community, Reports, Incidents, Activity.
// Renders the page header (title + subtitle + filter icon) and
// the tab pill bar. Card list content goes in `children`.
//
// Usage (standalone — e.g. Community, Reports, Incidents, no ScreenHeader above):
//   <ListScreenShell
//     title="Reports"
//     subtitle="Review reports submitted by the residents."
//     tabs={[
//       { key: "all", label: "All" },
//       { key: "pre", label: "Pre-disaster" },
//       { key: "post", label: "Post-disaster" },
//     ]}
//     defaultTab="all"
//     onFilterChange={(key) => console.log(key)}
//     onFilterPress={() => {/* open filter modal */}}
//   >
//     {/* card list here */}
//   </ListScreenShell>
//
// Usage (nested under a ScreenHeader — e.g. Activity):
//   <ScreenHeader title="Activity" />
//   <ListScreenShell title="My Reports" compact ...>
//     {/* card list here */}
//   </ListScreenShell>
//
// `compact` drops the shell's own top padding, since ScreenHeader already
// provides top spacing — without it the two stack and leave an oversized,
// disconnected-looking gap above the title.

export default function ListScreenShell({
  title,
  subtitle,
  tabs = [],
  defaultTab,
  onFilterChange,
  onFilterPress,
  compact = false,
  children,
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key ?? "all");

  function handleTabChange(key) {
    setActive(key);
    onFilterChange?.(key);
  }

  return (
    <div className={`list-screen${compact ? " list-screen--compact" : ""}`}>
      {/* Page header row */}
      <div className="list-screen__header">
        <div className="list-screen__title-group">
          <h1 className="list-screen__title">{title}</h1>
          {subtitle && (
            <p className="list-screen__subtitle">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          className="list-screen__filter-btn"
          aria-label="Open filters"
          onClick={onFilterPress}
        >
          <i className="fa-solid fa-sliders" aria-hidden="true" />
        </button>
      </div>

      {/* Tab pills */}
      {tabs.length > 0 && (
        <FilterBar tabs={tabs} active={active} onChange={handleTabChange} />
      )}

      {/* Card list — each page renders its own cards here */}
      <div className="list-screen__content">
        {children}
      </div>
    </div>
  );
}
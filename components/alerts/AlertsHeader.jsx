// components/alerts/AlertsHeader.jsx
import { useState } from "react";

export default function AlertsHeader({
  onFilterClick,
  search,
  onSearchChange,
  activeCount = 2,
  resolvedCount = 0,
  activeTab = "active",
  onTabChange,
}) {
  const [tab, setTab] = useState(activeTab);

  const handleTabClick = (key) => {
    setTab(key);
    onTabChange?.(key);
  };

  return (
    <div className="pt-6 pb-4">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold text-[#01277C]">
            Alerts
          </h1>
          <p className="text-md text-[#7a8aab] leading-snug ">
            Official updates and announcements from the engineering office
          </p>
        </div>

        <button
          onClick={onFilterClick}
          className="bg-white border border-[#d9e2f3] rounded-xl px-4 py-2 text-sm font-medium text-[#2f5bff] whitespace-nowrap shadow-[0_2px_6px_rgba(26,43,94,0.08)] cursor-pointer hover:bg-gray-50 active:scale-[0.98] transition"
        >
          Filter
        </button>
      </div>

      {/* Search bar */}
      <div className="mt-4">
        <i className="ti ti-search text-base text-[#7a8aab]" />
        <input
            type="text"
            placeholder="Search for location, severity, date..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="
              w-full
              box-border
              rounded-xl
              bg-gray-50
              px-4 py-4
              text-sm
              focus:border-blue-500
              focus:outline-none
              focus:ring-inset
              focus:ring-1
              focus:ring-blue-500
              shadow-[0_2px_6px_rgba(26,43,94,0.08)]
              placeholder:*:text-[#7a8aab]
            "
        />
      </div>
    </div>
  );
}
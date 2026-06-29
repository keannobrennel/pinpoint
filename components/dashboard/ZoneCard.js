"use client";

const PLACARD_STYLES = {
  inspected: {
    label: "Inspected",
    badge: "bg-green-100 text-green-800 border-green-300",
    bar: "bg-green-500",
  },
  restricted_use: {
    label: "Restricted use",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
    bar: "bg-amber-500",
  },
  unsafe: {
    label: "Unsafe",
    badge: "bg-red-100 text-red-800 border-red-300",
    bar: "bg-red-500",
  },
};

const NO_VERDICT = {
  label: "No verdict yet",
  badge: "bg-gray-100 text-gray-700 border-gray-300",
  bar: "bg-gray-300",
};

function relativeTime(isoString) {
  if (!isoString) return "—";
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * @param {{ zone: import("@/lib/schemas").Zone, onSelect?: (zoneId: string) => void, selected?: boolean }} props
 */
export default function ZoneCard({ zone, onSelect, selected }) {
  const verdictStyle = zone.officialVerdict
    ? PLACARD_STYLES[zone.officialVerdict]
    : NO_VERDICT;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(zone.id)}
      className={`w-full text-left rounded-lg border bg-white p-3 transition-colors hover:border-gray-400 ${
        selected ? "border-gray-900 ring-1 ring-gray-900" : "border-gray-200"
      }`}
    >
      <div className={`h-1 w-full rounded-full mb-3 ${verdictStyle.bar}`} />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {zone.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {zone.reportCount} report{zone.reportCount === 1 ? "" : "s"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${verdictStyle.badge}`}
        >
          {verdictStyle.label}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-gray-500">Avg. severity</p>
          <p className="font-medium text-gray-900">
            {Math.round(zone.averageSeverityScore)}/100
          </p>
        </div>
        <div>
          <p className="text-gray-500">Priority score</p>
          <p className="font-medium text-gray-900">
            {Math.round(zone.priorityScore)}
          </p>
        </div>
      </div>

      {zone.disasterMode && (
        <div className="mt-2 inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
          Disaster mode active
        </div>
      )}

      <p className="mt-2 text-xs text-gray-400">
        Updated {relativeTime(zone.updatedAt)}
      </p>
    </button>
  );
}

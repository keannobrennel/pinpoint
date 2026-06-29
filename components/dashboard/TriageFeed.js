"use client";

import { useMemo, useState } from "react";

const STATUS_STYLES = {
  under_review: "bg-gray-100 text-gray-700",
  inspector_dispatched: "bg-blue-100 text-blue-800",
  inspected: "bg-green-100 text-green-800",
  resolved: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS = {
  under_review: "Under review",
  inspector_dispatched: "Inspector dispatched",
  inspected: "Inspected",
  resolved: "Resolved",
};

const PLACARD_LABELS = {
  inspected: "Inspected",
  restricted_use: "Restricted use",
  unsafe: "Unsafe",
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "under_review", label: "Under review" },
  { value: "inspector_dispatched", label: "Dispatched" },
  { value: "inspected", label: "Inspected" },
  { value: "resolved", label: "Resolved" },
];

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
 * @param {{
 *   reports: import("@/lib/schemas").Report[],
 *   selectedZoneId?: string | null,
 *   onClearZoneFilter?: () => void,
 * }} props
 */
export default function TriageFeed({
  reports,
  selectedZoneId,
  onClearZoneFilter,
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBySeverity, setSortBySeverity] = useState(true);

  const filtered = useMemo(() => {
    let list = reports.filter((r) => r.accepted !== false);

    if (selectedZoneId) {
      list = list.filter((r) => r.zoneId === selectedZoneId);
    }

    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (sortBySeverity) {
      list = [...list].sort(
        (a, b) =>
          (b.aiAssessment?.severityScore ?? 0) -
          (a.aiAssessment?.severityScore ?? 0),
      );
    }

    return list;
  }, [reports, selectedZoneId, statusFilter, sortBySeverity]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                statusFilter === f.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1.5 text-xs text-gray-600 shrink-0">
          <input
            type="checkbox"
            checked={sortBySeverity}
            onChange={(e) => setSortBySeverity(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          Sort by severity
        </label>
      </div>

      {selectedZoneId && (
        <div className="mb-3 flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
          <span>Filtered to selected zone</span>
          <button
            type="button"
            onClick={onClearZoneFilter}
            className="font-medium text-gray-900 underline-offset-2 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center">
          <p className="text-sm text-gray-500">No reports match this filter.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((report) => (
            <li
              key={report.id}
              className="rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="flex gap-3">
                {report.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={report.photoUrl}
                    alt={`Hazard report: ${
                      report.aiAssessment?.affectedStructureType ?? "structure"
                    }`}
                    className="h-16 w-16 shrink-0 rounded-md object-cover bg-gray-100"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {report.aiAssessment?.affectedStructureType ??
                        "Unknown structure"}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[report.status] ??
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_LABELS[report.status] ?? report.status}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {report.aiAssessment?.damageClassification?.replaceAll(
                      "_",
                      " ",
                    )}
                    {" · "}
                    {PLACARD_LABELS[report.aiAssessment?.suggestedPlacard] ??
                      "—"}{" "}
                    suggested
                  </p>

                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      Severity{" "}
                      <span className="font-medium text-gray-900">
                        {report.aiAssessment?.severityScore ?? "—"}/100
                      </span>
                    </span>
                    <span>{relativeTime(report.createdAt)}</span>
                  </div>

                  {report.userNote && (
                    <p className="mt-1.5 text-xs text-gray-600 italic line-clamp-2">
                      &ldquo;{report.userNote}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

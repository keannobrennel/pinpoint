// components/ui/StatusBadge.jsx
// Pill badge for report/incident status.
// Covers lib/schemas.js `ReportStatus` and `ATC20Placard` values.
//
// Color key:
//   green  = resolved / verified-good states
//   yellow = awaiting action
//   blue   = inspected / assessed
//   purple = dispatched, in transit toward inspection
//   orange = active maintenance work
//   amber  = restricted access (placard)
//   red    = unsafe / confirmed false

const STATUS_CONFIG = {
  // ReportStatus
  pending:             { label: "PENDING",      className: "status-badge status-badge--pending" },
  responder_verified:  { label: "VERIFIED",     className: "status-badge status-badge--verified" },
  verified_false:      { label: "FALSE REPORT", className: "status-badge status-badge--unsafe" },
  inspector_dispatched:{ label: "DISPATCHED",   className: "status-badge status-badge--dispatched" },
  inspected:           { label: "INSPECTED",    className: "status-badge status-badge--assessed" },
  under_maintenance:   { label: "MAINTENANCE",  className: "status-badge status-badge--maintenance" },
  resolved:            { label: "RESOLVED",     className: "status-badge status-badge--verified" },

  // ATC20Placard (shown when a badge is rendered from placardType/officialVerdict
  // instead of report.status — "inspected" is shared with ReportStatus above)
  restricted_use:      { label: "RESTRICTED",   className: "status-badge status-badge--restricted" },
  unsafe:              { label: "UNSAFE",       className: "status-badge status-badge--unsafe" },

  // Generic aliases kept for any legacy callers passing looser strings
  verified:            { label: "VERIFIED",     className: "status-badge status-badge--verified" },
  assessed:            { label: "ASSESSED",     className: "status-badge status-badge--assessed" },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status?.toLowerCase()] ?? {
    label: status?.toUpperCase() ?? "UNKNOWN",
    className: "status-badge status-badge--default",
  };

  return <span className={config.className}>{config.label}</span>;
}
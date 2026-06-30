// components/ui/StatusBadge.jsx
// Pill badge for report/incident status.
// Colors match the UI: green=verified, yellow=pending, red=unsafe, blue=assessed.

const STATUS_CONFIG = {
  verified:           { label: "VERIFIED",   className: "status-badge status-badge--verified" },
  pending:            { label: "PENDING",    className: "status-badge status-badge--pending" },
  unsafe:             { label: "UNSAFE",     className: "status-badge status-badge--unsafe" },
  assessed:           { label: "ASSESSED",   className: "status-badge status-badge--assessed" },
  responder_verified: { label: "VERIFIED",   className: "status-badge status-badge--verified" },
  verified_false:     { label: "FALSE",      className: "status-badge status-badge--unsafe" },
  resolved:           { label: "RESOLVED",   className: "status-badge status-badge--verified" },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status?.toLowerCase()] ?? {
    label: status?.toUpperCase() ?? "UNKNOWN",
    className: "status-badge status-badge--default",
  };

  return <span className={config.className}>{config.label}</span>;
}
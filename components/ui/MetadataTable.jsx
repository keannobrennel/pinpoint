// components/ui/MetadataTable.jsx
// Label / value grid used on Report Details and Incident Details screens.
// Values can be plain strings or React nodes (e.g. a PhasePill or StatusBadge).
//
// Usage:
//   <MetadataTable rows={[
//     { label: "Report Name", value: "Cracked Wall in San Jose" },
//     { label: "Phase",       value: <PhasePill phase="post-disaster" /> },
//     { label: "Status",      value: <StatusBadge status="pending" /> },
//     { label: "Reported on", value: "June 29, 2026 | 10 AM" },
//   ]} />

export default function MetadataTable({ rows = [] }) {
  return (
    <div className="metadata-table">
      {rows.map((row, i) => (
        <div key={i} className="metadata-table__row">
          <span className="metadata-table__label">{row.label}</span>
          <span className="metadata-table__value">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
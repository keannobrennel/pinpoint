// lib/report-format.js
// Shared display-formatting helpers for a Report (see lib/schemas.js).
// Mirrors the title/location/date logic already used in ReportCard.jsx so
// the list and detail screens stay visually consistent.

export function formatReportTitle(report) {
  const { aiAssessment } = report || {};
  return aiAssessment?.affectedStructureType
    ? `${aiAssessment.damageClassification?.replace(/_/g, " ")} — ${aiAssessment.affectedStructureType}`
    : "Hazard Report";
}

export function formatReportLocation(report) {
  // city/barangay are top-level fields on the report doc (see
  // lib/schemas.js) — NOT nested inside location, which only holds
  // { lat, lng }. Reading location.city/location.barangay was always
  // undefined, which is why location silently disappeared everywhere.
  return [report?.barangay, report?.city].filter(Boolean).join(", ");
}

export function formatReportDateTime(isoTimestamp) {
  if (!isoTimestamp) return null;
  const date = new Date(isoTimestamp);
  const datePart = date.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} | ${timePart}`;
}
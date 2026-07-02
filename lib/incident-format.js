// lib/incident-format.js
// Shared display-formatting helpers for an Incident (see lib/schemas.js).
// Mirrors report-format.js so incident list/detail screens stay visually
// consistent with the reports screens.

export function formatIncidentTitle(incident) {
  return incident?.affectedStructureType && incident?.damageClassification
    ? `${incident.damageClassification.replace(/_/g, " ")} — ${incident.affectedStructureType}`
    : "Incident";
}

export function formatIncidentLocation(incident) {
  // Same shape as reports: barangay/city are top-level fields, not nested.
  return [incident?.barangay, incident?.city].filter(Boolean).join(", ");
}

// Incident.mode is "pre_disaster" | "post_disaster", same raw value as
// Report.mode — PhasePill expects the hyphenated form ("pre-disaster" /
// "post-disaster"), same conversion used in reports/[id]/page.js.
export function formatIncidentPhase(incident) {
  return (incident?.mode ?? "pre_disaster").replace(/_/g, "-");
}

export function formatIncidentDateTime(isoTimestamp) {
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
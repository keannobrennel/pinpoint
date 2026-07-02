// components/incidents/IncidentCard.jsx
// Card for clustered, verified incidents.
// Used in: Incidents list (engineer only).
//
// Props:
//   incident  — Incident object from Firestore (see lib/schemas.js)
//   onClick   — called when card is tapped

import StatusBadge from "@/components/ui/StatusBadge";
import PhasePill from "@/components/ui/PhasePill";
import {
  formatIncidentTitle,
  formatIncidentLocation,
  formatIncidentPhase,
} from "@/lib/incident-format";

function timeAgo(isoString) {
  if (!isoString) return null;
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}hr ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function IncidentCard({ incident, onClick }) {
  const {
    reportCount,
    reportIds,
    status,
    updatedAt,
    engineerAssessment,
  } = incident;

  const title = formatIncidentTitle(incident);
  const locationLabel = formatIncidentLocation(incident);
  const phase = formatIncidentPhase(incident);
  const count = reportCount ?? reportIds?.length ?? 0;
  const latest = timeAgo(updatedAt);

  return (
    <button type="button" className="report-card" onClick={onClick}>
      {/* Incidents have no single representative photo — they cluster
          N reports, each with their own imageUrl — so this is always a
          placeholder rather than trying to pick one report's photo. */}
      <div className="report-card__img-wrap">
        <div className="report-card__img-placeholder">
          <i className="fa-solid fa-layer-group" />
        </div>
      </div>

      {/* Content */}
      <div className="report-card__body">
        <div className="report-card__top">
          <StatusBadge status={status} />
          <i className="fa-solid fa-arrow-right report-card__arrow" aria-hidden="true" />
        </div>

        <p className="report-card__title">{title}</p>

        {locationLabel && (
          <p className="report-card__location">
            <i className="fa-solid fa-location-dot" aria-hidden="true" />
            {locationLabel}
          </p>
        )}

        <PhasePill phase={phase} />

        <div className="report-card__footer">
          <span className="report-card__count">
            <i className="fa-solid fa-user-group" aria-hidden="true" />
            {count} {count === 1 ? "report" : "reports"}
          </span>
          {latest && <span>· Latest {latest}</span>}
        </div>

        {/* Only shown once an engineer has actually assessed the
            incident — engineerAssessment is null until then (see
            lib/schemas.js), unlike the old mock which always showed a
            "Verified on" line. */}
        {engineerAssessment?.assessedAt && (
          <div className="report-card__footer--stacked">
            <span>
              Assessed on:{" "}
              {new Date(engineerAssessment.assessedAt).toLocaleDateString("en-PH", {
                month: "long", day: "numeric", year: "numeric",
              })}{" "}
              |{" "}
              {new Date(engineerAssessment.assessedAt).toLocaleTimeString("en-PH", {
                hour: "numeric", minute: "2-digit",
              })}
            </span>
            {engineerAssessment.assessedBy && (
              <span>Assessed by: {engineerAssessment.assessedBy}</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
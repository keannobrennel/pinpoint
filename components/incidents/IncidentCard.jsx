// components/incidents/IncidentCard.jsx
// Card for clustered, verified incidents.
// Used in: Incidents list (engineer only).
//
// Props:
//   incident  — Zone/Incident object from Firestore
//   onClick   — called when card is tapped

import Image from "next/image";
import StatusBadge from "@/components/ui/StatusBadge";
import PhasePill from "@/components/ui/PhasePill";

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
    imageUrl,
    name,
    center,
    reportCount,
    officialVerdict,
    verdictPostedAt,
    verdictPostedBy,
    updatedAt,
    disasterMode,
  } = incident;

  const phase = disasterMode ? "post-disaster" : "pre-disaster";
  const status = officialVerdict ?? "pending";
  const latest = timeAgo(updatedAt);

  return (
    <button type="button" className="report-card" onClick={onClick}>
      {/* Thumbnail — incidents use a representative image or placeholder */}
      <div className="report-card__img-wrap">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Incident photo"
            fill
            className="report-card__img"
            sizes="96px"
          />
        ) : (
          <div className="report-card__img-placeholder">
            <i className="fa-solid fa-image" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="report-card__body">
        <div className="report-card__top">
          <StatusBadge status={status} />
          <i className="fa-solid fa-arrow-right report-card__arrow" aria-hidden="true" />
        </div>

        <p className="report-card__title">{name}</p>

        {center && (
          <p className="report-card__location">
            <i className="fa-solid fa-location-dot" aria-hidden="true" />
            {/* Replace with reverse-geocoded label when available */}
            {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
          </p>
        )}

        <PhasePill phase={phase} />

        <div className="report-card__footer">
          {reportCount != null && (
            <span className="report-card__count">
              <i className="fa-solid fa-user-group" aria-hidden="true" />
              {reportCount} reports
            </span>
          )}
          {latest && <span>· Latest {latest}</span>}
        </div>

        {verdictPostedAt && (
          <div className="report-card__footer--stacked">
            <span>
              Verified on:{" "}
              {new Date(verdictPostedAt).toLocaleDateString("en-PH", {
                month: "long", day: "numeric", year: "numeric",
              })}{" "}
              |{" "}
              {new Date(verdictPostedAt).toLocaleTimeString("en-PH", {
                hour: "numeric", minute: "2-digit",
              })}
            </span>
            {verdictPostedBy && <span>Verified by: {verdictPostedBy}</span>}
          </div>
        )}
      </div>
    </button>
  );
}
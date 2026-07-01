// components/reports/ReportCard.jsx
// Card for individual report submissions.
// Used in: Reports list (responder/engineer), Activity/My Reports (all roles).
//
// Props:
//   report      — Report object from Firestore
//   onClick     — called when card is tapped
//   showReporter — show "Reporter: NAME" footer (false on Activity/My Reports)

import Image from "next/image";
import StatusBadge from "@/components/ui/StatusBadge";
import PhasePill from "@/components/ui/PhasePill";

export default function ReportCard({ report, onClick, showReporter = true }) {
  const {
    imageUrl,
    aiAssessment,
    location,
    status,
    reportedAt,
    verifiedByName,
  } = report;

  const title = aiAssessment?.affectedStructureType
    ? `${aiAssessment.damageClassification?.replace(/_/g, " ")} — ${aiAssessment.affectedStructureType}`
    : "Hazard Report";

  const locationLabel = [location?.barangay, location?.city]
    .filter(Boolean)
    .join(", ");

  const submittedDate = reportedAt
    ? new Date(reportedAt).toLocaleDateString("en-PH", {
        month: "long", day: "numeric", year: "numeric",
      }) + " | " +
      new Date(reportedAt).toLocaleTimeString("en-PH", {
        hour: "numeric", minute: "2-digit",
      })
    : null;

  return (
    <button type="button" className="report-card" onClick={onClick}>
      {/* Thumbnail */}
      <div className="report-card__img-wrap">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Report photo"
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

        <p className="report-card__title">{title}</p>

        {locationLabel && (
          <p className="report-card__location">
            <i className="fa-solid fa-location-dot" aria-hidden="true" />
            {locationLabel}
          </p>
        )}

        <PhasePill phase={aiAssessment?.phase ?? "pre-disaster"} />

        <div className="report-card__footer">
          {submittedDate && (
            <span>Submitted: {submittedDate}</span>
          )}
          {showReporter && verifiedByName && (
            <span>Reporter: {verifiedByName}</span>
          )}
        </div>
      </div>
    </button>
  );
}
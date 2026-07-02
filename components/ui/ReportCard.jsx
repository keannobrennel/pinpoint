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
    city,
    barangay,
    status,
    reportedAt,
    verifiedByName,
    mode,
  } = report;

  const title = aiAssessment?.affectedStructureType
    ? `${aiAssessment.damageClassification?.replace(/_/g, " ")} — ${aiAssessment.affectedStructureType}`
    : "Hazard Report";

  // city/barangay are top-level fields on the report doc (see
  // lib/schemas.js) — not nested under location, which only holds
  // { lat, lng }. Previously read as location?.barangay/location?.city,
  // which was always undefined.
  const locationLabel = [barangay, city].filter(Boolean).join(", ");

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

        <PhasePill phase={(mode ?? aiAssessment?.mode ?? "pre_disaster").replace(/_/g, "-")} />

        <div className="report-card__footer--stacked">
          {submittedDate && (
            <span>Submitted: {submittedDate}</span>
          )}
          {/* NOTE: this was showing verifiedByName under the label
              "Reporter", which is misleading — verifiedByName is the
              staff member who verified the report, not the citizen who
              submitted it. Relabeled to be accurate. If you want the
              actual submitter's name shown here instead, that requires
              resolving report.submittedBy (a uid) via a users/{uid}
              lookup, same as hooks/useReport.js now does for the detail
              page — happy to wire that in for the list too. */}
          {showReporter && verifiedByName && (
            <span>Verified by: {verifiedByName}</span>
          )}
        </div>
      </div>
    </button>
  );
}
// components/reports/ReportCard.jsx
import Link from "next/link";

// Status badge styles map directly to your design's pill colors
const STATUS_STYLES = {
  pending: { label: "Pending report", className: "badge-blue" },
  under_review: { label: "Under Review", className: "badge-orange" },
  under_inspection: { label: "Under Inspection", className: "badge-yellow" },
};

export default function ReportCard({ report, showReviewButton }) {
  const status = STATUS_STYLES[report.status] ?? {
    label: report.status,
    className: "badge-grey",
  };

  return (
    <div className="report-card">
      <img
        src={report.photoUrl}
        alt={report.title}
        className="report-card-thumb"
      />

      <div className="report-card-body">
        <div className="report-card-top">
          <span className={`badge ${status.className}`}>{status.label}</span>
          <Link href={`/reports/${report.id}`} className="see-details-link">
            See details
          </Link>
        </div>

        <p className="report-card-title">{report.title}</p>
        <p className="report-card-location">{report.location}</p>
        <p className="report-card-meta">Reported: {report.reportedAt}</p>

        {/* Only Engineers can act on a report — Residents only track status */}
        {showReviewButton && (
          <button
            className="review-btn"
            onClick={() => {
              // TODO: open the review/verdict flow for this report
            }}
          >
            Review
          </button>
        )}
      </div>
    </div>
  );
}
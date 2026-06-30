// components/alerts/AlertCard.jsx

// Maps each alert status to the colors/icon used in your design
const STATUS_CONFIG = {
  under_inspection: {
    label: "UNDER INSPECTION",
    icon: "👷",
    className: "alert-card-yellow",
  },
  unsafe: {
    label: "UNSAFE",
    icon: "⚠️",
    className: "alert-card-red",
  },
  resolved: {
    label: "RESOLVED",
    icon: "✅",
    className: "alert-card-green",
  },
};

export default function AlertCard({ alert }) {
  const config = STATUS_CONFIG[alert.status] ?? {
    label: alert.status,
    icon: "ℹ️",
    className: "alert-card-grey",
  };

  return (
    <div className={`alert-card ${config.className}`}>
      <span className="alert-card-icon">{config.icon}</span>

      <div className="alert-card-body">
        <div className="alert-card-top">
          <span className="alert-card-status">{config.label}</span>
          <span className="alert-card-time">{alert.timeAgo}</span>
        </div>

        <p className="alert-card-title">{alert.location}</p>
        <p className="alert-card-barangay">📍 {alert.barangay}</p>
        <p className="alert-card-message">{alert.message}</p>

        <p className="alert-card-footer">✅ Posted by {alert.postedBy}</p>
      </div>
    </div>
  );
}
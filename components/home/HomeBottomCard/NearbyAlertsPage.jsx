// components/home/HomeBottomCard/NearbyAlertsPage.jsx
export default function NearbyAlertsPage({ alerts }) {
  return (
    <div>
      <p className="card-label">⚠️ Nearby Alerts</p>
      {alerts.map((alert) => (
        <div key={alert.id} className="alert-row">
          <p>{alert.location}</p>
          <span className="status">{alert.status}</span>
          <p className="meta">{alert.distance} away · {alert.timeAgo}</p>
        </div>
      ))}
    </div>
  );
}
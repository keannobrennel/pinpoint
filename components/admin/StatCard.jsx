"use client";

export default function StatCard({ label, value, icon, color = "navy" }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-card__content">
        <p className="admin-stat-card__label">{label}</p>
        <p className={`admin-stat-card__value admin-stat-card__value--${color}`}>
          {value}
        </p>
      </div>
      {icon && (
        <div className={`admin-stat-card__icon admin-stat-card__icon--${color}`}>
          <i className={icon} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

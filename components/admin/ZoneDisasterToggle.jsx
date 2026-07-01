"use client";

import { useState } from "react";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ZoneDisasterToggle({ zones, onToggle, loading }) {
  const [pendingId, setPendingId] = useState(null);

  async function handleToggle(zone) {
    setPendingId(zone.id);
    try {
      await onToggle(zone.id, !zone.disasterMode);
    } finally {
      setPendingId(null);
    }
  }

  if (loading) {
    return <p className="admin-empty">Loading zones…</p>;
  }

  if (zones.length === 0) {
    return <p className="admin-empty">No zones found.</p>;
  }

  return (
    <ul className="admin-zone-list">
      {zones.map((zone) => {
        const isPending = pendingId === zone.id;

        return (
          <li
            key={zone.id}
            className={`admin-zone-card${zone.disasterMode ? " admin-zone-card--disaster" : ""}`}
          >
            <div className="admin-zone-card__info">
              <p className="admin-zone-card__name">{zone.name}</p>
              <p className="admin-zone-card__meta">
                {zone.reportCount ?? 0} reports · Updated {formatDate(zone.disasterModeUpdatedAt)}
              </p>
            </div>

            <button
              type="button"
              className={`admin-toggle${zone.disasterMode ? " admin-toggle--active" : ""}`}
              onClick={() => handleToggle(zone)}
              disabled={isPending}
              aria-pressed={zone.disasterMode}
              aria-label={`Toggle disaster mode for ${zone.name}`}
            >
              <span className="admin-toggle__label">
                {zone.disasterMode ? "Disaster mode" : "Normal"}
              </span>
              <span className="admin-toggle__track">
                <span className="admin-toggle__thumb" />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
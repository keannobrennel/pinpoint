// components/home/HomeBottomCard/NearbyAlertsPage.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { verdictToTier } from '@/components/map/Heatmap';

const STATUS_LABEL = {
  no_assessment: 'No assessment yet',
  pending_inspection: 'Inspection in progress',
  inspector_dispatched: 'Inspector dispatched',
  assessed: 'Assessment complete',
};

const TIER_CONFIG = {
  safe: {
    label: 'Safe',
    color: 'rgb(99, 230, 190)',
    iconClass: 'fa-solid fa-circle-check',
  },
  caution: {
    label: 'Caution',
    color: 'rgb(255, 180, 0)',
    iconClass: 'fa-solid fa-triangle-exclamation',
  },
  dangerous: {
    label: 'Dangerous',
    color: 'rgb(220, 31, 31)',
    iconClass: 'fa-solid fa-triangle-exclamation',
  },
  unknown: {
    label: 'Unassessed',
    color: '#9ca3af',
    iconClass: 'fa-solid fa-circle-question',
  },
};

const ICON_MIN_PX = 30;
const ICON_MAX_PX = 44;
const ICON_HEIGHT_RATIO = 0.45;

export default function NearbyAlertsPage({
  alerts = [],
  activeIndex = 0,
  onIndexChange,
  onViewMore,
}) {
  const infoRef = useRef(null);
  const [iconFontSize, setIconFontSize] = useState(ICON_MIN_PX);

  useEffect(() => {
    const el = infoRef.current;
    if (!el) return;

    const updateIconSize = () => {
      const height = el.offsetHeight;
      if (!height) return;
      const target = Math.round(height * ICON_HEIGHT_RATIO);
      setIconFontSize(Math.min(ICON_MAX_PX, Math.max(ICON_MIN_PX, target)));
    };

    updateIconSize();

    const observer = new ResizeObserver(updateIconSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeIndex, alerts.length]);

  const hasAlerts = alerts.length > 0;
  const safeIndex = hasAlerts
    ? ((activeIndex % alerts.length) + alerts.length) % alerts.length
    : 0;
  const current = hasAlerts ? alerts[safeIndex] : null;

  const statusText = current
    ? STATUS_LABEL[current.inspectionStatus] ?? current.inspectionStatus ?? 'No assessment yet'
    : '';

  const tier = current ? verdictToTier(current.officialVerdict) : 'unknown';
  const tierConfig = TIER_CONFIG[tier] ?? TIER_CONFIG.unknown;

  const metaText = current
    ? [
        current.distance && `${current.distance} away`,
        current.timeAgo && `Reported ${current.timeAgo}`,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  const goPrev = () => onIndexChange?.(safeIndex - 1);
  const goNext = () => onIndexChange?.(safeIndex + 1);
  const canStep = alerts.length > 1;

  return (
    <div className="nearby-alerts-page">
      {/* Header */}
      <div className="nearby-alerts-page__header">
        <p className="nearby-alerts-page__title">
          <span className="nearby-alerts-page__title-icon-wrap">
            <i className="fa-solid fa-bell" style={{ color: "#FA6304", fontSize: 16 }}></i>
          </span>
          Nearby Alerts
        </p>
        <button type="button" className="nearby-alerts-page__see-all">
          See all <i className="fa-solid fa-chevron-right" style={{ fontSize: 11 }}></i>
        </button>
      </div>

      {!hasAlerts && (
        <p className="nearby-alerts-page__empty">No nearby alerts right now.</p>
      )}

      {hasAlerts && (
        <div className="nearby-alerts-page__body">
          {/* Prev arrow */}
          <button
            type="button"
            className="nearby-alerts-page__nav-btn"
            onClick={goPrev}
            aria-label="Previous alert"
            disabled={!canStep}
          >
            ‹
          </button>

          <div className="nearby-alerts-page__content">
            {/* Tier icon */}
            <div className="nearby-alerts-page__icon-wrap" aria-hidden="true">
              <i
                className={tierConfig.iconClass}
                style={{ color: tierConfig.color, fontSize: `${iconFontSize}px` }}
              ></i>
            </div>

            {/* Info */}
            <div className="nearby-alerts-page__info" ref={infoRef}>
              <p className="nearby-alerts-page__place" title={current.placeName}>
                {current.placeName ?? 'Unnamed location'}
              </p>

              <div className="nearby-alerts-page__status-row">
                <span className="nearby-alerts-page__status">{statusText}</span>
              </div>

              {current.postedBy && (
                <p className="nearby-alerts-page__posted-by">
                  <i className="fa-solid fa-circle-check"></i>
                  {current.postedBy}
                </p>
              )}

              {metaText && <p className="nearby-alerts-page__meta">{metaText}</p>}

              <button
                type="button"
                className="nearby-alerts-page__view-more"
                onClick={() => onViewMore?.(current)}
              >
                View More
              </button>
            </div>
          </div>

          {/* Next arrow */}
          <button
            type="button"
            className="nearby-alerts-page__nav-btn"
            onClick={goNext}
            aria-label="Next alert"
            disabled={!canStep}
          >
            ›
          </button>
        </div>
      )}

      {hasAlerts && alerts.length > 1 && (
        <div className="nearby-alerts-page__dots">
          {alerts.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`nearby-alerts-page__dot${i === safeIndex ? ' nearby-alerts-page__dot--active' : ''}`}
              onClick={() => onIndexChange?.(i)}
              aria-label={`Go to alert ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
// components/home/HomeBottomCard/NearbyAlertsPage.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import "./NearbyAlertsPage.css";
import { verdictToTier } from '@/components/map/Heatmap';

/**
 * NearbyAlertsPage.jsx
 *
 * One of the two pages swapped inside HomeBottomCard (controlled by the
 * dots indicator). Shows a single-card carousel of nearby alert zones.
 *
 * Styling lives in NearbyAlertsPage.css (imported above), NOT inline —
 * the whole card (header, "See all", the alert, and the ‹ › arrows) is one
 * self-contained block via the `.nearby-alerts-page` class, so it doesn't
 * depend on `.home-bottom-card` in home.css supplying a background.
 *
 *   - "See all ›"  — static for now, no list view wired yet.
 *   - "‹" / "›"    — step through `alerts`, driven by `activeIndex` +
 *                    `onIndexChange`. Lifted to page.js so the map can fly
 *                    to the alert being viewed.
 *   - "View More"  — opens the full ZoneDetailDialog via `onViewMore`.
 *
 * `alerts` items are zone objects (see page.js) — placeName / postedBy /
 * distance / timeAgo live directly on the zone, so "View More" can hand
 * the same object straight to ZoneDetailDialog with no remapping.
 *
 * Status row shows TWO separate things side by side:
 *   1. inspectionStatus — workflow state (grey pill), e.g. "Inspector dispatched"
 *   2. officialVerdict tier — Safe / Caution / Dangerous (colored label),
 *      derived via verdictToTier() — same source of truth Heatmap.js and
 *      ZoneDetailDialog.js use, so this card never disagrees with the map.
 * The left-hand icon mirrors the tier color/meaning (plain <i className=
 * "fa-solid ..."> per the rest of the codebase, not the FA Kit component).
 *
 * ICON SIZING NOTE: the icon is sized to match the height of
 * .nearby-alerts-page__info via a ResizeObserver (see iconFontSize state
 * below), NOT CSS container query units (cqh). An earlier version used
 * `container-type: size` + `clamp(.., 70cqh, ..)`, which broke badly on
 * some mobile WebViews — `size` containment combined with flex
 * align-items:stretch created a circular sizing dependency that some
 * browsers resolved into a runaway value, blowing the icon up and
 * overlapping all the text. ResizeObserver has far more consistent
 * cross-browser/WebView support and avoids the containment issue entirely.
 */

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
    color: 'rgb(255, 212, 59)',
    iconClass: 'fa-solid fa-triangle-exclamation',
  },
  dangerous: {
    label: 'Dangerous',
    color: 'rgb(220, 31, 31)',
    iconClass: 'fa-solid fa-circle-exclamation',
  },
  // verdictToTier() falls back to 'unknown' when there's no official verdict yet
  unknown: {
    label: 'Unassessed',
    color: '#9ca3af',
    iconClass: 'fa-solid fa-circle-question',
  },
};

// Bounds for the icon's font-size, in px — mirrors the old clamp(22px, .., 44px).
// Bounds for the icon's font-size, in px.
const ICON_MIN_PX = 30;
const ICON_MAX_PX = 30;
// Icon font-size as a fraction of the measured info-block height.
const ICON_HEIGHT_RATIO = 0.4;

export default function NearbyAlertsPage({
  alerts = [],
  activeIndex = 0,
  onIndexChange,
  onViewMore,
}) {
  const infoRef = useRef(null);
  const [iconFontSize, setIconFontSize] = useState(ICON_MIN_PX);

  // Measure .nearby-alerts-page__info's height whenever it changes (new
  // alert swapped in, place name wraps to a second line, etc.) and scale
  // the icon to match, clamped to a sane min/max.
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
      <div className="nearby-alerts-page__header">
        <p className="nearby-alerts-page__title">
          <i className="fa-solid fa-bell" style={{ color: "#FA6304", marginRight: "8px" }}></i>
          Nearby Alerts
        </p>
        {/* Static for now — wiring a full alerts list view is a follow-up task */}
        <button type="button" className="nearby-alerts-page__see-all" disabled aria-disabled="true">
          See all &gt;
        </button>
      </div>

      {!hasAlerts && (
        <p className="nearby-alerts-page__empty">No nearby alerts right now.</p>
      )}

      {hasAlerts && (
        <div className="nearby-alerts-page__body">
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
            {/* Tier icon — font-size driven by ResizeObserver above, NOT CSS
                container queries (see file-level note for why). */}
            <div className="nearby-alerts-page__icon-wrap" aria-hidden="true">
              <i
                className={tierConfig.iconClass}
                style={{ color: tierConfig.color, fontSize: `${iconFontSize}px` }}
              ></i>
            </div>

            <div className="nearby-alerts-page__info" ref={infoRef}>
              <p className="nearby-alerts-page__place" title={current.placeName}>
                {current.placeName ?? 'Unnamed location'}
              </p>

              {/* Status row: inspection status (grey) + tier label (colored) */}
              <div className="nearby-alerts-page__status-row">
                <span className="nearby-alerts-page__status">{statusText}</span>
                <span
                  className="nearby-alerts-page__tier-label"
                  style={{ color: tierConfig.color }}
                >
                  {tierConfig.label}
                </span>
              </div>

              {current.postedBy && (
                <p className="nearby-alerts-page__posted-by">Posted by {current.postedBy}</p>
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
    </div>
  );
}
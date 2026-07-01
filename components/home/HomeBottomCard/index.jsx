// components/home/HomeBottomCard/index.jsx
"use client";
import { useState } from "react";
import NearbyAlertsPage from "./NearbyAlertsPage";
import OverviewPage from "./OverviewPage";

const pages = [NearbyAlertsPage, OverviewPage];

export default function HomeBottomCard({
  alerts,
  stats,
  isEngineer,
  activeAlertIndex,
  onAlertIndexChange,
  onViewMore,
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const ActivePage = pages[pageIndex];

  return (
    <div className="home-bottom-card">
      <ActivePage
        alerts={alerts}
        stats={stats}
        isEngineer={isEngineer}
        // Only used by NearbyAlertsPage — OverviewPage ignores these.
        activeIndex={activeAlertIndex}
        onIndexChange={onAlertIndexChange}
        onViewMore={onViewMore}
      />

      {/* dots indicator */}
      <div className="dots">
        {pages.map((_, i) => (
          <button
            key={i}
            className={i === pageIndex ? "dot active" : "dot"}
            onClick={() => setPageIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
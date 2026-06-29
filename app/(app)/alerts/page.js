// app/(app)/alerts/page.js
"use client";

import { useState } from "react";
import AlertCard from "@/components/alerts/AlertCard";

export default function AlertsPage() {
  // Per the designs, Alerts looks identical for Residents and Engineers —
  // no role branching needed here. If that changes later (e.g. Engineers
  // get a "Push Alert" button), branch the same way the other pages do.

  const [activeTab, setActiveTab] = useState("active"); // "active" | "resolved"
  const [search, setSearch] = useState("");

  // TODO: replace with real data fetching
  const allAlerts = [
    {
      id: "1",
      status: "under_inspection",
      location: "Mabini Elementary School",
      barangay: "Brgy. Mabini",
      message:
        "Inspection in progress. Please avoid the area and follow the safety protocol.",
      timeAgo: "1m ago",
      postedBy: "San Jose Engineering Office",
    },
    {
      id: "2",
      status: "unsafe",
      location: "Mabini Elementary School",
      barangay: "Brgy. Mabini",
      message:
        "Building declared as UNSAFE. Avoid entering the area and follow the safety protocol.",
      timeAgo: "1m ago",
      postedBy: "San Jose Engineering Office",
    },
  ];

  const filteredAlerts = allAlerts.filter((alert) => {
    const matchesTab =
      activeTab === "active"
        ? alert.status !== "resolved"
        : alert.status === "resolved";
    const matchesSearch = alert.location
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const activeCount = allAlerts.filter((a) => a.status !== "resolved").length;

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <h1>Alerts</h1>
        <button className="filter-btn">Filter</button>
      </div>
      <p className="alerts-subtext">
        Official updates and announcements from the engineering office
      </p>

      <input
        type="text"
        placeholder="Search for location, severity, date..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="alerts-search"
      />

      <div className="alerts-tabs">
        <button
          className={activeTab === "active" ? "tab active" : "tab"}
          onClick={() => setActiveTab("active")}
        >
          Active ({activeCount})
        </button>
        <button
          className={activeTab === "resolved" ? "tab active" : "tab"}
          onClick={() => setActiveTab("resolved")}
        >
          Resolved
        </button>
      </div>

      <div className="alerts-list">
        {filteredAlerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
        {filteredAlerts.length === 0 && (
          <p className="empty-state">No alerts to show.</p>
        )}
      </div>
    </div>
  );
}
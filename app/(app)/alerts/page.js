// app/(app)/alerts/page.js
"use client";

import { useState } from "react";
import AlertsHeader from "@/components/alerts/AlertsHeader";
import AlertsTabs from "@/components/alerts/AlertsTabs";
import AlertCard from "@/components/alerts/AlertCard";

export default function AlertsPage() {
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
  const resolvedCount = allAlerts.filter((a) => a.status === "resolved").length;

  return (
    <div className="min-h-screen">
      <AlertsHeader
        onFilterClick={() => {
          /* TODO: open filter sheet */
        }}
        search={search}
        onSearchChange={setSearch}
      />

      <AlertsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeCount={activeCount}
        resolvedCount={resolvedCount}
      />

      <div className="py-4 flex flex-col gap-3">
        {filteredAlerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
        {filteredAlerts.length === 0 && (
          <p className="text-center text-sm text-[#7a8aab] mt-10">
            No alerts to show.
          </p>
        )}
      </div>
    </div>
  );
}
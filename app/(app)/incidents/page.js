"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { useIncidents } from "@/hooks/useIncidents";
import ListScreenShell from "@/components/ui/ListScreenShell";
import IncidentCard from "@/components/incidents/IncidentCard";

const TABS = [
  { key: "all", label: "All" },
  { key: "pre", label: "Pre-disaster" },
  { key: "post", label: "Post-disaster" },
];

// Incident.mode carries the same raw values as Report.mode — see
// reports/page.js for the identical mapping.
const TAB_TO_MODE = {
  pre: "pre_disaster",
  post: "post_disaster",
};

export default function IncidentsPage() {
  const { status } = useAuthGuard(["engineer"]);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");

  const { incidents, loading } = useIncidents();

  if (status !== "ready") return null;

  const filteredIncidents =
    activeTab === "all"
      ? incidents
      : incidents.filter((incident) => incident.mode === TAB_TO_MODE[activeTab]);

  return (
    <ListScreenShell
      title="Incidents"
      subtitle="Clustered and verified reports requiring engineer assessment."
      tabs={TABS}
      defaultTab="all"
      onFilterChange={setActiveTab}
    >
      {loading ? (
        <p className="reports-list-status">Loading incidents...</p>
      ) : filteredIncidents.length === 0 ? (
        <p className="reports-list-status">No incidents to show.</p>
      ) : (
        filteredIncidents.map((incident) => (
          <IncidentCard
            key={incident.id}
            incident={incident}
            onClick={() => router.push(`/incidents/${incident.id}`)}
          />
        ))
      )}
    </ListScreenShell>
  );
}
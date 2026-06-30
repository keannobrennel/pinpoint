"use client";

import { useAuthGuard } from "@/lib/use-auth-guard";
import ListScreenShell from "@/components/ui/ListScreenShell";

const TABS = [
  { key: "all",  label: "All" },
  { key: "pre",  label: "Pre-disaster" },
  { key: "post", label: "Post-disaster" },
];

export default function IncidentsPage() {
  const { status } = useAuthGuard(["engineer"]);

  if (status !== "ready") return null;

  return (
    <ListScreenShell
      title="Incidents"
      subtitle="Clustered and verified reports requiring engineer assessment."
      tabs={TABS}
      defaultTab="all"
    >
      {/* IncidentCard list goes here */}
    </ListScreenShell>
  );
}
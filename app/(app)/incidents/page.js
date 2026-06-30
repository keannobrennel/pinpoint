"use client";

import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/use-auth-guard";
import ListScreenShell from "@/components/ui/ListScreenShell";
import IncidentCard from "@/components/incidents/IncidentCard";

const TABS = [
  { key: "all",  label: "All" },
  { key: "pre",  label: "Pre-disaster" },
  { key: "post", label: "Post-disaster" },
];

// Placeholder incidents — replace with Firestore data when ready.
const MOCK_INCIDENTS = [
  {
    id: "1",
    imageUrl: null,
    name: "Cracked Walls in San Jose",
    center: { lat: 14.8137, lng: 121.0474 },
    reportCount: 18,
    officialVerdict: "verified",
    verdictPostedAt: "2026-06-29T10:00:00.000Z",
    verdictPostedBy: "Responder 01",
    updatedAt: "2026-06-29T10:02:00.000Z",
    disasterMode: true,
  },
];

export default function IncidentsPage() {
  const { status } = useAuthGuard(["engineer"]);
  const router = useRouter();

  if (status !== "ready") return null;

  return (
    <ListScreenShell
      title="Incidents"
      subtitle="Clustered and verified reports requiring engineer assessment."
      tabs={TABS}
      defaultTab="all"
    >
      {MOCK_INCIDENTS.map((incident) => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          onClick={() => router.push(`/incidents/${incident.id}`)}
        />
      ))}
    </ListScreenShell>
  );
}
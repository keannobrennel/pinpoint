"use client";

import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/use-auth-guard";
import ListScreenShell from "@/components/ui/ListScreenShell";
import ReportCard from "@/components/ui/ReportCard";

const TABS = [
  { key: "all",  label: "All" },
  { key: "pre",  label: "Pre-disaster" },
  { key: "post", label: "Post-disaster" },
];

// Placeholder reports — replace with Firestore data when ready.
const MOCK_REPORTS = [
  {
    id: "1",
    imageUrl: null,
    aiAssessment: {
      damageClassification: "structural_crack",
      affectedStructureType: "San Jose",
      phase: "post-disaster",
    },
    location: { barangay: "San Jose del Monte", city: "Bulacan" },
    status: "unsafe",
    reportedAt: "2026-06-29T10:00:00.000Z",
    verifiedByName: "EMILY ELIMY",
  },
  {
    id: "2",
    imageUrl: null,
    aiAssessment: {
      damageClassification: "structural_crack",
      affectedStructureType: "San Jose",
      phase: "pre-disaster",
    },
    location: { barangay: "San Jose del Monte", city: "Bulacan" },
    status: "unsafe",
    reportedAt: "2026-06-29T10:00:00.000Z",
    verifiedByName: "EMILY ELIMY",
  },
];

export default function ReportsPage() {
  const { status } = useAuthGuard(["responder", "engineer"]);
  const router = useRouter();

  if (status !== "ready") return null;

  return (
    <ListScreenShell
      title="Reports"
      subtitle="Review reports submitted by the residents."
      tabs={TABS}
      defaultTab="all"
    >
      {MOCK_REPORTS.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          showReporter={true}
          onClick={() => router.push(`/reports/${report.id}`)}
        />
      ))}
    </ListScreenShell>
  );
}
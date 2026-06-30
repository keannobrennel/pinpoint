"use client";

import { useAuthGuard } from "@/lib/use-auth-guard";
import ListScreenShell from "@/components/ui/ListScreenShell";

const TABS = [
  { key: "all",  label: "All" },
  { key: "pre",  label: "Pre-disaster" },
  { key: "post", label: "Post-disaster" },
];

export default function ReportsPage() {
  const { status } = useAuthGuard(["responder", "engineer"]);

  if (status !== "ready") return null;

  return (
    <ListScreenShell
      title="Reports"
      subtitle="Review reports submitted by the residents."
      tabs={TABS}
      defaultTab="all"
    >
      {/* ReportCard list goes here */}
    </ListScreenShell>
  );
}
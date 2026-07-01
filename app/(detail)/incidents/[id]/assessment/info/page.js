// app/(detail)/incidents/[id]/assessment/info/page.js
"use client";

import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthGuard } from "@/lib/use-auth-guard";
import ScreenHeader from "@/components/layout/ScreenHeader";
import AssessmentFrameworkContent from "@/components/assessment/AssessmentFrameworkContent";
import AssessmentInfoContent from "@/components/assessment/AssessmentInfoContent";

export default function AssessmentInfoPage({ params }) {
  const routeParams = use(params);
  const incidentId = routeParams.id;
  const { status } = useAuthGuard(["engineer"]);
  const router = useRouter();
  const searchParams = useSearchParams();

  if (status !== "ready") return null;

  // "1" | "2" | "3" | "4" | "review" | "finished" | "view"
  const from = searchParams.get("from");

  const onBack = () =>
    from === "view"
      ? router.push(`/incidents/${incidentId}/assessment/view`)
      : router.push(`/incidents/${incidentId}/assessment${from ? `?step=${from}` : ""}`);

  return (
    <div className="detail-screen">
      <ScreenHeader title="Assessment Standards" onBack={onBack} />

      {/* .app-content already scrolls (styles/shell.css) — this card just
          needs to not fight that, which it doesn't (no fixed heights). */}
      <div className="detail-screen__card">
        <AssessmentFrameworkContent />
        <div className="detail-screen__divider" />
        <AssessmentInfoContent />
      </div>
    </div>
  );
}
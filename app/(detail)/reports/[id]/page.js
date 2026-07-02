// app/(app)/reports/[id]/page.js
"use client";

import { use, useEffect, useState } from "react";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { adminFetch } from "@/lib/admin-api";
import ScreenHeader from "@/components/layout/ScreenHeader";
import MetadataTable from "@/components/ui/MetadataTable";
import SectionHeader from "@/components/ui/SectionHeader";
import PhasePill from "@/components/ui/PhasePill";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast, { useToast } from "@/components/ui/Toast";
import Image from "next/image";

// Statuses that count as "currently verified" for the toggle button.
const VERIFIED_STATUSES = ["responder_verified", "auto_verified", "verified"];

// Report has no stored "name"/title field in schemas.js — mirrors the same
// fallback logic ReportCard.jsx already uses, so list and detail agree.
function reportTitle(report) {
  const { aiAssessment } = report;
  if (aiAssessment?.affectedStructureType) {
    return `${aiAssessment.damageClassification?.replace(/_/g, " ")} — ${aiAssessment.affectedStructureType}`;
  }
  return "Hazard Report";
}

function formatDate(iso) {
  if (!iso) return null;
  return (
    new Date(iso).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }) +
    " | " +
    new Date(iso).toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
    })
  );
}

export default function ReportDetailPage({ params }) {
  const { id } = use(params);
  const { profile, status } = useAuthGuard(["responder", "engineer", "admin"]);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    if (status !== "ready") return;
    let cancelled = false;

    async function fetchReport() {
      setLoading(true);
      setError(null);
      try {
        const data = await adminFetch(`/api/reports/${id}`);
        if (!cancelled) setReport(data);
      } catch (err) {
        if (!cancelled) setError(err.message ?? "Failed to load report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchReport();
    return () => {
      cancelled = true;
    };
  }, [id, status]);

  if (status !== "ready") return null;
  if (loading) return <div className="screen-loading">Loading report...</div>;
  if (error || !report) {
    return (
      <div className="detail-screen">
        <ScreenHeader title="Report Details" />
        <p className="detail-screen__body-text">
          {error ?? "Report not found."}
        </p>
      </div>
    );
  }

  const isVerified = VERIFIED_STATUSES.includes(report.status);
  const isLockedFalse = report.status === "verified_false";
  const isAutoVerified = report.isAutoVerified === true;
  const locationLabel =
    [report.barangay, report.city].filter(Boolean).join(", ") || "—";

  const metaRows = [
    { label: "Report Name", value: reportTitle(report) },
    { label: "Location", value: locationLabel },
    { label: "Phase", value: <PhasePill phase={report.aiAssessment?.mode === "post_disaster" ? "post-disaster" : "pre-disaster"} /> },
    { label: "Status", value: <StatusBadge status={report.status} /> },
    { label: "Reported on", value: formatDate(report.reportedAt) },
    // NOTE: the Report schema only stores `submittedBy` (a uid) — there is
    // no reporter display name field. Falling back to the uid rather than
    // inventing a name. If you want a real display name here, the
    // submission route (POST /api/reports) needs to snapshot the
    // submitter's displayName the same way verify already snapshots the
    // verifier's name.
    { label: "Reported by", value: report.submittedBy ?? "—" },
    ...(report.verifiedAt
      ? [
          { label: "Verified on", value: formatDate(report.verifiedAt) },
          { label: "Verified by", value: report.verifiedByName ?? "—" },
        ]
      : []),
  ];

  async function handleConfirmToggle() {
    setSubmitting(true);
    try {
      const nextStatus = isVerified ? "unverified" : "verified_true";
      const updated = await adminFetch(`/api/reports/${id}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ verificationStatus: nextStatus }),
      });
      setReport((prev) => ({ ...prev, ...updated }));
      showToast(
        isVerified
          ? "Report has been unverified."
          : "Report has been verified.",
      );
    } catch (err) {
      showToast(err.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  const canToggle =
    !isAutoVerified &&
    !isLockedFalse &&
    (profile?.role === "responder" ||
      profile?.role === "engineer" ||
      profile?.role === "admin");

  return (
    <div className="detail-screen">
      <ScreenHeader title="Report Details" />

      {isVerified && (
        <div className="detail-screen__verified-banner">
          <i className="fa-solid fa-circle-check" aria-hidden="true" />
          Report has been verified.
        </div>
      )}

      <div className="detail-screen__card">
        <MetadataTable rows={metaRows} />

        <div className="detail-screen__divider" />

        <SectionHeader>Description</SectionHeader>
        <p className="detail-screen__body-text">
          {report.description || "No description provided."}
        </p>

        {isVerified && report.responderNote && (
          <>
            <SectionHeader>Responder Comments</SectionHeader>
            <p className="detail-screen__body-text">{report.responderNote}</p>
          </>
        )}
      </div>

      <SectionHeader>Photo Preview</SectionHeader>
      <div className="detail-screen__photo">
        {report.imageUrl ? (
          <Image
            src={report.imageUrl}
            alt="Report photo"
            fill
            className="detail-screen__photo-img"
          />
        ) : (
          <div className="detail-screen__photo-placeholder">
            <i className="fa-solid fa-image" aria-hidden="true" />
          </div>
        )}
      </div>

      {isLockedFalse && (
        <p className="detail-screen__body-text">
          This report was marked false and can no longer be changed.
        </p>
      )}
      {isAutoVerified && (
        <p className="detail-screen__body-text">
          This report was auto-verified at submission and can&apos;t be
          re-verified here.
        </p>
      )}

      {canToggle && (
        <div className="detail-screen__footer">
          <button
            type="button"
            className={`detail-screen__action-btn${isVerified ? " detail-screen__action-btn--outline" : ""}`}
            onClick={() => setConfirmOpen(true)}
            disabled={submitting}
          >
            {isVerified ? "Unverify Report" : "Verify Report"}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={isVerified ? "Unverify Report?" : "Verify Report?"}
        message={
          isVerified
            ? "This will revert the report back to pending."
            : "This confirms the report as accurate and verified."
        }
        confirmLabel={isVerified ? "Unverify" : "Verify"}
        cancelLabel="Cancel"
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmOpen(false)}
      />

      <Toast message={toast?.message} show={!!toast} />
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuthGuard } from "@/lib/use-auth-guard";
import Link from "next/link";

const ALLOWED_ROLES = ["admin"];

const VERIFICATION_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800",
};

async function callAdminApi(path, method = "GET", body = null) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw new Error("Not signed in");
  }

  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }

  return data;
}

export default function EngineerDetailPage({ params }) {
  const router = useRouter();
  const { status } = useAuthGuard(ALLOWED_ROLES);
  const { uid } = params;

  const [engineer, setEngineer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const [fullName, setFullName] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [issuingBody, setIssuingBody] = useState("");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [enabled, setEnabled] = useState(true);

  const [verifyMessage, setVerifyMessage] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingUid, setRejectingUid] = useState(null);

  // Fetch engineer - must be before auth check
  useEffect(() => {
    if (status === "ready") {
      fetchEngineer();
    }
  }, [uid, status]);

  async function fetchEngineer() {
    setLoading(true);
    setError(null);
    try {
      const data = await callAdminApi(`/api/admin/engineers/${uid}`, "GET");
      setEngineer(data);
      setFullName(data.fullName || "");
      setLicenseType(data.licenseType || "");
      setLicenseNumber(data.licenseNumber || "");
      setIssuingBody(data.issuingBody || "");
      setLicenseExpiryDate(
        data.licenseExpiryDate
          ? new Date(data.licenseExpiryDate).toISOString().split("T")[0]
          : "",
      );
      setEnabled(data.enabled !== false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);
    try {
      await callAdminApi(`/api/admin/engineers/${uid}`, "PUT", {
        fullName,
        licenseType,
        licenseNumber,
        issuingBody,
        licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate).toISOString() : null,
        enabled,
      });

      setSaveMessage({ type: "success", text: "Engineer updated successfully" });
      setIsEditing(false);
      await fetchEngineer();
    } catch (err) {
      setSaveMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleVerifyCredential() {
    setVerifyMessage(null);
    try {
      await callAdminApi(`/api/admin/engineers/${uid}/verify`, "PATCH");
      setVerifyMessage({ type: "success", text: "Credential verified successfully" });
      await fetchEngineer();
    } catch (err) {
      setVerifyMessage({ type: "error", text: err.message });
    }
  }

  async function handleRejectCredential() {
    if (!rejectionReason.trim()) {
      setVerifyMessage({ type: "error", text: "Please provide a rejection reason" });
      return;
    }

    setVerifyMessage(null);
    try {
      await callAdminApi(`/api/admin/engineers/${uid}/reject`, "PATCH", {
        reason: rejectionReason,
      });
      setVerifyMessage({ type: "success", text: "Credential rejected" });
      setRejectingUid(null);
      setRejectionReason("");
      await fetchEngineer();
    } catch (err) {
      setVerifyMessage({ type: "error", text: err.message });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Loading engineer…</p>
      </div>
    );
  }

  if (error || !engineer) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <p className="text-sm text-red-600">{error || "Engineer not found"}</p>
        <Link href="/admin/engineers" className="mt-3 text-xs text-blue-600 hover:underline">
          Back to engineers
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Link href="/admin/engineers" className="text-xs text-blue-600 hover:underline">
            Back to engineers
          </Link>
          <h1 className="mt-2 text-base font-semibold text-gray-900">
            Engineer: {engineer.email}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-6">
        {/* Credential Verification Card */}
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Credential Verification</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                VERIFICATION_STATUS_COLORS[engineer.credentialVerificationStatus] ||
                "bg-gray-100 text-gray-800"
              }`}
            >
              {engineer.credentialVerificationStatus}
            </span>
          </div>

          {verifyMessage && (
            <p
              className={`mb-3 text-xs ${
                verifyMessage.type === "error" ? "text-red-600" : "text-green-700"
              }`}
            >
              {verifyMessage.text}
            </p>
          )}

          <div className="space-y-2 text-xs mb-4">
            <div>
              <span className="font-medium text-gray-700">License Number: </span>
              {engineer.licenseNumber}
            </div>
            <div>
              <span className="font-medium text-gray-700">License Type: </span>
              {engineer.licenseType || "—"}
            </div>
            <div>
              <span className="font-medium text-gray-700">Issuing Body: </span>
              {engineer.issuingBody || "—"}
            </div>
            <div>
              <span className="font-medium text-gray-700">Expiry Date: </span>
              {engineer.licenseExpiryDate
                ? new Date(engineer.licenseExpiryDate).toLocaleDateString()
                : "—"}
            </div>
            <div>
              <span className="font-medium text-gray-700">Credential File: </span>
              {engineer.credentialFileUrl ? (
                <a
                  href={engineer.credentialFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View
                </a>
              ) : (
                "—"
              )}
            </div>
            {engineer.credentialUploadedAt && (
              <div>
                <span className="font-medium text-gray-700">Uploaded: </span>
                {new Date(engineer.credentialUploadedAt).toLocaleDateString()}
              </div>
            )}
            {engineer.credentialRejectionReason && (
              <div>
                <span className="font-medium text-gray-700">Rejection Reason: </span>
                <p className="text-red-600">{engineer.credentialRejectionReason}</p>
              </div>
            )}
          </div>

          {/* Verification Actions */}
          {engineer.credentialVerificationStatus === "pending" && (
            <div className="border-t pt-4 space-y-3">
              <button
                onClick={handleVerifyCredential}
                className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Verify Credential
              </button>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Or reject with reason:
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Why is this credential being rejected?"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs resize-none h-16"
                />
                <button
                  onClick={handleRejectCredential}
                  className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Reject Credential
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Edit Engineer Profile */}
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Engineer Profile</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-blue-600 hover:underline"
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
          </div>

          {saveMessage && (
            <p
              className={`mb-3 text-xs ${
                saveMessage.type === "error" ? "text-red-600" : "text-green-700"
              }`}
            >
              {saveMessage.text}
            </p>
          )}

          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-3"
            >
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="License Type"
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="License Number"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Issuing Body"
                value={issuingBody}
                onChange={(e) => setIssuingBody(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={licenseExpiryDate}
                onChange={(e) => setLicenseExpiryDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-xs text-gray-700">Enabled</span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </form>
          ) : (
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Full Name: </span>
                {fullName || "—"}
              </div>
              <div>
                <span className="font-medium text-gray-700">License Type: </span>
                {licenseType || "—"}
              </div>
              <div>
                <span className="font-medium text-gray-700">License Number: </span>
                {licenseNumber || "—"}
              </div>
              <div>
                <span className="font-medium text-gray-700">Issuing Body: </span>
                {issuingBody || "—"}
              </div>
              <div>
                <span className="font-medium text-gray-700">License Expiry: </span>
                {licenseExpiryDate ? new Date(licenseExpiryDate).toLocaleDateString() : "—"}
              </div>
              <div>
                <span className="font-medium text-gray-700">Status: </span>
                <span className={enabled ? "text-green-600" : "text-red-600"}>
                  {enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Metadata */}
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-gray-900">Metadata</h2>
          <div className="space-y-1 text-xs text-gray-600">
            <div>
              <span className="font-medium">Created: </span>
              {engineer.createdAt ? new Date(engineer.createdAt).toLocaleString() : "—"}
            </div>
            <div>
              <span className="font-medium">Last Login: </span>
              {engineer.lastLoginAt ? new Date(engineer.lastLoginAt).toLocaleString() : "Never"}
            </div>
            {engineer.verifiedAt && (
              <div>
                <span className="font-medium">Verified At: </span>
                {new Date(engineer.verifiedAt).toLocaleString()}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

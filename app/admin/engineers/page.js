"use client";

import { useState, useEffect } from "react";
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

async function callAdminApi(path, body) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw new Error("Not signed in");
  }

  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }

  return data;
}

export default function EngineersPage() {
  const { status } = useAuthGuard(ALLOWED_ROLES);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [issuingBody, setIssuingBody] = useState("");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [credentialFileUrl, setCredentialFileUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState(null);

  // Fetch engineers - must be before auth check
  useEffect(() => {
    if (status === "ready") {
      fetchEngineers();
    }
  }, [statusFilter, status]);

  async function fetchEngineers() {
    setLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in");

      const query = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/admin/engineers${query}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to fetch engineers");
      }

      const data = await res.json();
      setEngineers(data.engineers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEngineer(e) {
    e.preventDefault();
    setCreating(true);
    setCreateMessage(null);
    try {
      const result = await callAdminApi("/api/admin/engineers", {
        email,
        password,
        fullName,
        licenseType,
        licenseNumber,
        issuingBody,
        licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate).toISOString() : null,
        credentialFileUrl,
      });

      setCreateMessage({
        type: "success",
        text: `Created engineer ${result.email}. Verification status: ${result.credentialVerificationStatus}`,
      });

      // Reset form
      setEmail("");
      setPassword("");
      setFullName("");
      setLicenseType("");
      setLicenseNumber("");
      setIssuingBody("");
      setLicenseExpiryDate("");
      setCredentialFileUrl("");

      // Refresh engineers list
      await fetchEngineers();
      setShowCreateForm(false);
    } catch (err) {
      setCreateMessage({ type: "error", text: err.message });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-semibold text-gray-900">Engineer Management</h1>
              <p className="text-xs text-gray-500">Create and manage engineer accounts with credential verification</p>
            </div>
            <Link href="/admin" className="text-xs text-blue-600 hover:underline">
              Back to Admin
            </Link>
          </div>
        </div>
      </header>

      {status !== "ready" && (
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500">
          Loading…
        </div>
      )}

      {status === "ready" && (
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
          {/* Create Engineer Form */}
          <section className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900">Create New Engineer Account</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showCreateForm ? "Collapse" : "Expand"}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateEngineer} className="space-y-3">
              {/* Login Credentials */}
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Login Credentials</p>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              {/* Personal Info */}
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Personal Information</p>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
                />
                <input
                  type="text"
                  placeholder="License Type (e.g., Professional Engineer)"
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
                />
                <input
                  type="text"
                  required
                  placeholder="License Number"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
                />
                <input
                  type="text"
                  placeholder="Issuing Body (e.g., PRC)"
                  value={issuingBody}
                  onChange={(e) => setIssuingBody(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              {/* License Info */}
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-gray-700 mb-2">License Information</p>
                <input
                  type="date"
                  placeholder="License Expiry Date"
                  value={licenseExpiryDate}
                  onChange={(e) => setLicenseExpiryDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
                />
                <input
                  type="url"
                  placeholder="Credential File URL (upload to cloud first)"
                  value={credentialFileUrl}
                  onChange={(e) => setCredentialFileUrl(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create Engineer Account"}
              </button>
            </form>
          )}

          {createMessage && (
            <p
              className={`mt-3 text-xs ${
                createMessage.type === "error" ? "text-red-600" : "text-green-700"
              }`}
            >
              {createMessage.text}
            </p>
          )}
        </section>

        {/* Engineers List */}
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Engineers</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Verification</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          {loading ? (
            <p className="text-sm text-gray-400">Loading engineers…</p>
          ) : engineers.length === 0 ? (
            <p className="text-sm text-gray-400">No engineers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Full Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">License #</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Verified</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Created</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {engineers.map((eng) => (
                    <tr key={eng.uid} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs">{eng.email}</td>
                      <td className="px-4 py-3 text-xs">{eng.fullName}</td>
                      <td className="px-4 py-3 text-xs">{eng.licenseNumber}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            VERIFICATION_STATUS_COLORS[eng.credentialVerificationStatus] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {eng.credentialVerificationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {eng.verifiedAt ? new Date(eng.verifiedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {eng.createdAt ? new Date(eng.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/engineers/${eng.uid}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      )}
    </div>
  );
}

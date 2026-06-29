"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { useZonesFeed } from "@/lib/use-dashboard-data";

const ALLOWED_ROLES = ["admin"];

const PLACARD_OPTIONS = [
  { value: "inspected", label: "Inspected" },
  { value: "restricted_use", label: "Restricted use" },
  { value: "unsafe", label: "Unsafe" },
];

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

export default function AdminPage() {
  const router = useRouter();
  const { status } = useAuthGuard(ALLOWED_ROLES);
  const { zones, loading: zonesLoading } = useZonesFeed();

  const [engineerEmail, setEngineerEmail] = useState("");
  const [engineerPassword, setEngineerPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState(null);

  const [verdictZoneId, setVerdictZoneId] = useState("");
  const [verdictValue, setVerdictValue] = useState("inspected");
  const [bannerMessage, setBannerMessage] = useState("");
  const [postingVerdict, setPostingVerdict] = useState(false);
  const [verdictMessage, setVerdictMessage] = useState(null);

  const [togglingZoneId, setTogglingZoneId] = useState(null);
  const [toggleMessage, setToggleMessage] = useState(null);

  const [signingOut, setSigningOut] = useState(false);

  if (status !== "ready") {
    return null;
  }

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setSigningOut(false);
    }
  };

  const handleCreateEngineer = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateMessage(null);
    try {
      const result = await callAdminApi("/api/admin/create-engineer", {
        email: engineerEmail,
        password: engineerPassword,
      });
      setCreateMessage({ type: "success", text: `Created ${result.email}` });
      setEngineerEmail("");
      setEngineerPassword("");
    } catch (err) {
      setCreateMessage({ type: "error", text: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handlePostVerdict = async (e) => {
    e.preventDefault();
    if (!verdictZoneId) {
      setVerdictMessage({ type: "error", text: "Select a zone first" });
      return;
    }
    setPostingVerdict(true);
    setVerdictMessage(null);
    try {
      await callAdminApi("/api/admin/post-verdict", {
        zoneId: verdictZoneId,
        verdict: verdictValue,
        alertBannerMessage: bannerMessage || undefined,
      });
      setVerdictMessage({ type: "success", text: "Verdict posted" });
      setBannerMessage("");
    } catch (err) {
      setVerdictMessage({ type: "error", text: err.message });
    } finally {
      setPostingVerdict(false);
    }
  };

  const handleToggleDisasterMode = async (zoneId, nextValue) => {
    setTogglingZoneId(zoneId);
    setToggleMessage(null);
    try {
      await callAdminApi("/api/admin/toggle-disaster-mode", {
        zoneId,
        disasterMode: nextValue,
      });
    } catch (err) {
      setToggleMessage({ type: "error", text: err.message });
    } finally {
      setTogglingZoneId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-base font-semibold text-gray-900">Admin panel</h1>
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </header>

      <nav className="border-b border-gray-200 bg-white px-4 sm:px-6">
        <div className="mx-auto max-w-4xl flex gap-6">
          <Link href="/admin" className="px-1 py-3 text-xs font-medium text-gray-700 border-b-2 border-gray-900">
            Dashboard
          </Link>
          <Link href="/admin/engineers" className="px-1 py-3 text-xs font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent">
            Engineer Management
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-medium text-gray-900">
            Create engineer account
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Creates a sign-in account and grants dashboard access.
          </p>

          <form onSubmit={handleCreateEngineer} className="mt-3 space-y-2">
            <input
              type="email"
              required
              placeholder="engineer@example.com"
              value={engineerEmail}
              onChange={(e) => setEngineerEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Temporary password (min 8 characters)"
              value={engineerPassword}
              onChange={(e) => setEngineerPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create account"}
            </button>
          </form>

          {createMessage && (
            <p
              className={`mt-2 text-xs ${
                createMessage.type === "error"
                  ? "text-red-600"
                  : "text-green-700"
              }`}
            >
              {createMessage.text}
            </p>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-medium text-gray-900">
            Post zone verdict
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Sets the official ATC-20 placard the public map displays for this
            zone.
          </p>

          <form onSubmit={handlePostVerdict} className="mt-3 space-y-2">
            <select
              required
              value={verdictZoneId}
              onChange={(e) => setVerdictZoneId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                {zonesLoading ? "Loading zones…" : "Select a zone"}
              </option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>

            <select
              value={verdictValue}
              onChange={(e) => setVerdictValue(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {PLACARD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Public alert message (optional)"
              value={bannerMessage}
              onChange={(e) => setBannerMessage(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />

            <button
              type="submit"
              disabled={postingVerdict}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {postingVerdict ? "Posting…" : "Post verdict"}
            </button>
          </form>

          {verdictMessage && (
            <p
              className={`mt-2 text-xs ${
                verdictMessage.type === "error"
                  ? "text-red-600"
                  : "text-green-700"
              }`}
            >
              {verdictMessage.text}
            </p>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-medium text-gray-900">Disaster mode</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Escalates a zone from baseline hazard reporting to post-event surge
            triage.
          </p>

          {toggleMessage && (
            <p className="mt-2 text-xs text-red-600">{toggleMessage.text}</p>
          )}

          <ul className="mt-3 divide-y divide-gray-100">
            {zonesLoading ? (
              <li className="py-2 text-sm text-gray-400">Loading zones…</li>
            ) : zones.length === 0 ? (
              <li className="py-2 text-sm text-gray-400">No zones yet.</li>
            ) : (
              zones.map((zone) => (
                <li
                  key={zone.id}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-gray-900">{zone.name}</span>
                  <button
                    type="button"
                    disabled={togglingZoneId === zone.id}
                    onClick={() =>
                      handleToggleDisasterMode(zone.id, !zone.disasterMode)
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                      zone.disasterMode
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {togglingZoneId === zone.id
                      ? "Updating…"
                      : zone.disasterMode
                        ? "Disaster mode on"
                        : "Disaster mode off"}
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}

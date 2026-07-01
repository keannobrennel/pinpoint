"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { adminFetch } from "@/lib/admin-api";
import ZoneDisasterToggle from "@/components/admin/ZoneDisasterToggle";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zonesError, setZonesError] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await adminFetch("/api/admin/users", { method: "GET" });
        const list = Array.isArray(data?.users) ? data.users : [];
        setUsers(list.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    async function fetchZones() {
      try {
        const data = await adminFetch("/api/zones", { method: "GET" });
        const list = Array.isArray(data) ? data : [];
        setZones(list.sort((a, b) => (b.reportCount ?? 0) - (a.reportCount ?? 0)));
      } catch (err) {
        setZonesError(err.message);
      } finally {
        setZonesLoading(false);
      }
    }

    fetchUsers();
    fetchZones();
  }, []);

  async function handleDisasterToggle(zoneId, enabled) {
    setZonesError(null);
    try {
      await adminFetch(`/api/zones/${zoneId}/disaster-mode`, {
        method: "POST",
        body: JSON.stringify({ enabled }),
      });

      setZones((current) =>
        current.map((zone) =>
          zone.id === zoneId
            ? { ...zone, disasterMode: enabled, disasterModeUpdatedAt: new Date().toISOString() }
            : zone
        )
      );
    } catch (err) {
      setZonesError(err.message);
    }
  }

  const counts = {
    total: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    engineer: users.filter((u) => u.role === "engineer").length,
    responder: users.filter((u) => u.role === "responder").length,
    public: users.filter((u) => (u.role || "public") === "public").length,
  };

  const recentUsers = users.slice(0, 5);
  const recentActivity = users
    .filter((u) => u.lastLoginAt)
    .sort((a, b) => new Date(b.lastLoginAt) - new Date(a.lastLoginAt))
    .slice(0, 5);

  const asOfTime = new Date().toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Dashboard</h1>
          <p className="admin-page__subtitle">Overview of users, roles, and recent activity.</p>
        </div>
        <Link href="/admin/users" className="admin-btn admin-btn--primary">
          <i className="fa-solid fa-users" aria-hidden="true" />
          Manage users
        </Link>
      </div>

      <div className="admin-glance-card">
        <div>
          <p className="admin-glance-card__title">
            Overview <em>at a Glance</em>
          </p>
          <p className="admin-glance-card__subtitle">As of today, {asOfTime}</p>
        </div>
        <div className="admin-glance-card__art">
          <Image
            src="/images/chick1.png"
            alt="Safety inspector illustration"
            width={150}
            height={150}
            priority
          />
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert--error">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Total Users</span>
          <span className="admin-stat-card__value admin-stat-card__value--navy">
            {loading ? "—" : counts.total}
          </span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Admins</span>
          <span className="admin-stat-card__value admin-stat-card__value--orange">
            {loading ? "—" : counts.admin}
          </span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Engineers</span>
          <span className="admin-stat-card__value admin-stat-card__value--blue">
            {loading ? "—" : counts.engineer}
          </span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Responders</span>
          <span className="admin-stat-card__value admin-stat-card__value--green">
            {loading ? "—" : counts.responder}
          </span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Public</span>
          <span className="admin-stat-card__value admin-stat-card__value--navy">
            {loading ? "—" : counts.public}
          </span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Avg. Response Time</span>
          <span className="admin-stat-card__value admin-stat-card__value--small">
            Engineers respond in
            <strong>2 days</strong>
          </span>
        </div>
      </div>

      <section className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">Disaster mode</h2>
            <p className="admin-card__subtitle">
              Toggle surge triage status per zone. Affected zones show alert banners to the public.
            </p>
          </div>
        </div>
        <div className="admin-card__body">
          {zonesError && (
            <div className="admin-alert admin-alert--error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {zonesError}
            </div>
          )}
          <ZoneDisasterToggle zones={zones} onToggle={handleDisasterToggle} loading={zonesLoading} />
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">Recent users</h2>
            <p className="admin-card__subtitle">Newest accounts added to the console.</p>
          </div>
          <Link href="/admin/users" className="admin-link">
            View all
          </Link>
        </div>
        <div className="admin-card__body">
          {loading ? (
            <p className="admin-empty">Loading…</p>
          ) : recentUsers.length === 0 ? (
            <p className="admin-empty">No users yet.</p>
          ) : (
            <ul className="admin-mini-list">
              {recentUsers.map((user) => (
                <li key={user.uid} className="admin-mini-list__item">
                  <div className="admin-mini-list__avatar">
                    <span>{(user.displayName || user.email || "?").charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="admin-mini-list__info">
                    <p>{user.displayName || user.email || user.uid}</p>
                    <span>{user.email}</span>
                  </div>
                  <span className="admin-mini-list__meta">{formatDate(user.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">Recent activity</h2>
            <p className="admin-card__subtitle">Last sign-ins across all roles.</p>
          </div>
        </div>
        <div className="admin-card__body">
          {loading ? (
            <p className="admin-empty">Loading…</p>
          ) : recentActivity.length === 0 ? (
            <p className="admin-empty">No recent logins.</p>
          ) : (
            <ul className="admin-mini-list">
              {recentActivity.map((user) => (
                <li key={`activity-${user.uid}`} className="admin-mini-list__item">
                  <div className="admin-mini-list__icon admin-mini-list__icon--blue">
                    <i className="fa-solid fa-arrow-right-to-bracket" aria-hidden="true" />
                  </div>
                  <div className="admin-mini-list__info">
                    <p>{user.displayName || user.email || user.uid}</p>
                    <span>Logged in</span>
                  </div>
                  <span className="admin-mini-list__meta">{formatDate(user.lastLoginAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
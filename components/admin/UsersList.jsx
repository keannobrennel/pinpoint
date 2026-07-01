"use client";

import { useState, useMemo } from "react";
import { VALID_ROLES, formatRole } from "@/lib/roles";
import FilterBar from "@/components/ui/FilterBar";
import RoleBadge from "./RoleBadge";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UsersList({ users, onRoleChange, loading }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || (user.role || "public") === roleFilter;
      const term = search.toLowerCase();
      const matchesSearch =
        !term ||
        (user.displayName || "").toLowerCase().includes(term) ||
        (user.email || "").toLowerCase().includes(term) ||
        (user.uid || "").toLowerCase().includes(term);
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const roleCounts = useMemo(() => {
    return VALID_ROLES.reduce((acc, role) => {
      acc[role] = users.filter((u) => (u.role || "public") === role).length;
      return acc;
    }, {});
  }, [users]);

  const roleTabs = useMemo(
    () => [
      { key: "all", label: `All (${users.length})` },
      ...VALID_ROLES.map((role) => ({
        key: role,
        label: `${formatRole(role)} (${roleCounts[role]})`,
      })),
    ],
    [users.length, roleCounts]
  );

  return (
    <div className="admin-users">
      <div className="admin-users__filters">
        <div className="admin-users__search">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by name, email, or UID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <FilterBar tabs={roleTabs} active={roleFilter} onChange={setRoleFilter} />
      </div>

      <div className="admin-users__list">
        {loading && <p className="admin-empty">Loading users…</p>}

        {!loading && filteredUsers.length === 0 && <p className="admin-empty">No users found.</p>}

        {!loading &&
          filteredUsers.map((user) => (
            <div key={user.uid} className="admin-user-card">
              <div className="admin-user-card__avatar">
                <span>{(user.displayName || user.email || "?").charAt(0).toUpperCase()}</span>
              </div>

              <div className="admin-user-card__info">
                <p className="admin-user-card__name">{user.displayName || user.email || user.uid}</p>
                {user.displayName && user.email && <p className="admin-user-card__email">{user.email}</p>}
                <p className="admin-user-card__meta">Created {formatDate(user.createdAt)}</p>
              </div>

              <div className="admin-user-card__actions">
                <RoleBadge role={user.role} />
                <select
                  value={user.role || "public"}
                  onChange={(e) => onRoleChange(user.uid, e.target.value)}
                  className="admin-form__select admin-form__select--small"
                  aria-label="Change user role"
                >
                  {VALID_ROLES.map((item) => (
                    <option key={item} value={item}>
                      {formatRole(item)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

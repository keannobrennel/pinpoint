"use client";

import { useEffect, useState, useCallback } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuthGuard } from "@/lib/use-auth-guard";
import CreateAccountForm from "@/components/admin/CreateAccountForm";
import UsersList from "@/components/admin/UsersList";

export default function UserManagementPage() {
  const { status } = useAuthGuard(["admin"]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch("/api/admin/users", { method: "GET" });
      const list = Array.isArray(data?.users) ? data.users : [];
      setUsers(list.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "ready") {
      fetchUsers();
    }
  }, [status, fetchUsers]);

  if (status !== "ready") return null;

  async function handleCreateUser({ email, password, displayName, role }) {
    setCreating(true);
    setCreateMessage(null);

    try {
      const result = await adminFetch("/api/admin/create-user", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName, role }),
      });

      setCreateMessage({ type: "success", text: `Created ${result.email} as ${role}.` });
      await fetchUsers();
    } catch (err) {
      setCreateMessage({ type: "error", text: err.message });
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(uid, nextRole) {
    const previousUsers = users;
    setUsers((current) =>
      current.map((item) => (item.uid === uid ? { ...item, role: nextRole } : item))
    );

    try {
      await adminFetch("/api/admin/set-user-role", {
        method: "POST",
        body: JSON.stringify({ uid, role: nextRole }),
      });
    } catch (err) {
      setUsers(previousUsers);
      setError(err.message);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Users</h1>
          <p className="admin-page__subtitle">Create accounts and manage roles for all users.</p>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert--error">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          {error}
        </div>
      )}

      {createMessage && (
        <div
          className={`admin-alert ${
            createMessage.type === "error" ? "admin-alert--error" : "admin-alert--success"
          }`}
        >
          <i
            className={
              createMessage.type === "error"
                ? "fa-solid fa-circle-exclamation"
                : "fa-solid fa-circle-check"
            }
            aria-hidden="true"
          />
          {createMessage.text}
        </div>
      )}

      <section className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">Create account</h2>
            <p className="admin-card__subtitle">
              New accounts can be assigned any role. Self-signup defaults to Public.
            </p>
          </div>
        </div>
        <div className="admin-card__body">
          <CreateAccountForm onSubmit={handleCreateUser} loading={creating} />
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">All users</h2>
            <p className="admin-card__subtitle">
              Search, filter, and change roles for existing users.
            </p>
          </div>
        </div>
        <div className="admin-card__body">
          <UsersList users={users} onRoleChange={handleRoleChange} loading={loading} />
        </div>
      </section>
    </div>
  );
}
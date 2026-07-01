"use client";

import { useState } from "react";
import { VALID_ROLES, formatRole } from "@/lib/roles";

export default function CreateAccountForm({ onSubmit, loading }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("public");

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ email, password, displayName, role });
    setEmail("");
    setPassword("");
    setDisplayName("");
    setRole("public");
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="admin-form__grid">
        <div className="admin-form__field">
          <label htmlFor="displayName" className="admin-form__label">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            placeholder="Juan Dela Cruz"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="admin-form__input"
          />
        </div>

        <div className="admin-form__field">
          <label htmlFor="role" className="admin-form__label">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="admin-form__select"
          >
            {VALID_ROLES.map((item) => (
              <option key={item} value={item}>
                {formatRole(item)}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-form__field">
          <label htmlFor="email" className="admin-form__label">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="admin-form__input"
          />
        </div>

        <div className="admin-form__field">
          <label htmlFor="password" className="admin-form__label">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="admin-form__input"
          />
        </div>
      </div>

      <div className="admin-form__actions">
        <button type="submit" disabled={loading} className="admin-btn admin-btn--primary">
          {loading ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
              Creating…
            </>
          ) : (
            <>
              <i className="fa-solid fa-plus" aria-hidden="true" />
              Create account
            </>
          )}
        </button>
      </div>
    </form>
  );
}

"use client";

import { formatRole } from "@/lib/roles";

const ROLE_STYLES = {
  admin: "role-badge--admin",
  engineer: "role-badge--engineer",
  responder: "role-badge--responder",
  public: "role-badge--public",
};

export default function RoleBadge({ role }) {
  const normalized = role?.toLowerCase() ?? "public";
  const styleClass = ROLE_STYLES[normalized] ?? "role-badge--default";

  return <span className={`role-badge ${styleClass}`}>{formatRole(role)}</span>;
}

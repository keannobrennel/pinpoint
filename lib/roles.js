/**
 * Role utilities for canonicalization.
 */
export const VALID_ROLES = ["admin", "engineer", "responder", "public"];

export function normalizeRole(role) {
  if (!role) return "public";
  // historical alias
  if (role === "citizen") return "public";
  return role;
}

export function isValidRole(role) {
  return VALID_ROLES.includes(normalizeRole(role));
}

export function formatRole(role) {
  const normalized = normalizeRole(role);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

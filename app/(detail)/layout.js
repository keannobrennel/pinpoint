// app/(detail)/layout.js
// Layout for detail and wizard screens — no BottomNav, no shared header.
// Auth is handled per-page via useAuthGuard, not here.
// Imports all shared CSS so detail screens have access to tokens,
// shell, and component styles without duplicating imports per page.
"use client";

import "@/styles/tokens.css";
import "@/styles/shell.css";
import "@/styles/badges.css";
import "@/styles/cards.css";
import "@/styles/detail.css";

export default function DetailLayout({ children }) {
  return (
    <div className="app-shell">
      <main className="app-content">{children}</main>
    </div>
  );
}
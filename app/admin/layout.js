"use client";

import { useState } from "react";
import { useAuthGuard } from "@/lib/use-auth-guard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import "@/styles/admin/admin.css";

export default function AdminLayout({ children }) {
  const { status } = useAuthGuard(["admin", "engineer"]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status !== "ready") {
    return (
      <div className="admin-loading">
        <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
        <span>Loading admin…</span>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <AdminSidebar />

      {sidebarOpen && (
        <div
          className="admin-shell__overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={`admin-shell__sidebar-mobile${sidebarOpen ? " admin-shell__sidebar-mobile--open" : ""}`}>
        <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="admin-shell__main">
        <AdminHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="admin-shell__content">{children}</main>
      </div>
    </div>
  );
}

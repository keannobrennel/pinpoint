"use client";

import { useAuthGuard } from "@/lib/use-auth-guard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import "@/styles/admin/admin.css";

export default function AdminLayout({ children }) {
  const { status } = useAuthGuard(["admin", "engineer"]);

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
      <div className="admin-shell__main">
        <AdminHeader />
        <main className="admin-shell__content">{children}</main>
      </div>
      <AdminBottomNav />
    </div>
  );
}
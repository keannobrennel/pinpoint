// app/(app)/layout.js
// Shared shell for every signed-in screen: Home, Alerts, Reports.
// Both Residents and Engineers pass through this same layout —
// the role-specific differences happen INSIDE each page, not here.
"use client";
import "@/styles/(app)/layout.css";
import BottomNav from "@/components/layout/BottomNav";
import { useAuth } from "@/hooks/useAuth";

export default function AppLayout({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return <div className="screen-loading">Loading...</div>;
  }

  return (
    <div className="app-shell">
      <main className="app-content">{children}</main>
      <BottomNav />
    </div>
  );
}
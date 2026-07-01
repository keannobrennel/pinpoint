// app/(app)/layout.js
"use client";

import "@/styles/tokens.css";
import "@/styles/shell.css";
import "@/styles/header.css";
import "@/styles/bottom-nav.css";
import "@/styles/list-screen.css";
import "@/styles/badges.css";
import "@/styles/cards.css";

import BottomNav from "@/components/layout/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }) {
  const { loading } = useAuth();
  const pathname = usePathname();
  const isFullScreen = pathname.startsWith("/home");

  if (loading) {
    return <div className="screen-loading">Loading...</div>;
  }

  if (isFullScreen) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          {children}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="app-content">{children}</main>
      <BottomNav />
    </div>
  );
}
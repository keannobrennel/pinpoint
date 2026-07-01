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
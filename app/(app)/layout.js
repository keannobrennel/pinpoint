// app/(app)/layout.js
"use client";

import "@/styles/tokens.css";
import "@/styles/shell.css";
import "@/styles/header.css";
import "@/styles/bottom-nav.css";
import "@/styles/list-screen.css";
import "@/styles/badges.css";
import "@/styles/cards.css";
import "@/styles/skeleton.css";

import BottomNav from "@/components/layout/BottomNav";
import HomeSkeleton from "@/components/layout/HomeSkeleton";
import ListSkeleton from "@/components/layout/ListSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }) {
  const { loading } = useAuth();
  const pathname = usePathname();
  const isFullScreen = pathname.startsWith("/home");

  // isFullScreen is computed above, before the loading check, specifically
  // so we know which skeleton shape to show — /home looks nothing like
  // every other app-shell route (map+overlays vs. title bar+cards), so a
  // single generic skeleton can't cover both without looking off on one.
  if (loading) {
    return isFullScreen ? <HomeSkeleton /> : <ListSkeleton />;
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
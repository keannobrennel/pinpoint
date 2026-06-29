// components/layout/BottomNav.jsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/home", label: "Home", icon: "🏠" },
  { href: "/alerts", label: "Alerts", icon: "🔔" },
  { href: "/report-list", label: "Reports", icon: "📄" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? "nav-item active" : "nav-item"}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        );
      })}

      {/* Camera button — floating, always opens the report flow regardless of tab */}
      <button
        className="nav-camera-btn"
        onClick={() => router.push("/report")}
        aria-label="Report a hazard"
      >
        📷
      </button>
    </nav>
  );
}
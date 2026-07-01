"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "fa-solid fa-table-columns" },
  { href: "/admin/users", label: "User Management", icon: "fa-solid fa-users" },
];

export default function AdminSidebar({ onNavigate }) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <Image src="/pinpoint-logo-pin.png" alt="PinPoint" width={36} height={36} priority />
        <div>
          <p className="admin-sidebar__title">PinPoint</p>
          <p className="admin-sidebar__subtitle">Admin Panel</p>
        </div>
      </div>

      <nav className="admin-sidebar__nav" aria-label="Admin navigation">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`admin-sidebar__link${active ? " admin-sidebar__link--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <i className={icon} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar__footer">
        <Link href="/home" className="admin-sidebar__link">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          <span>Back to App</span>
        </Link>
      </div>
    </aside>
  );
}

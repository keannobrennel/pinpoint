"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "fa-solid fa-table-columns", exact: true },
  { href: "/admin/users", label: "Users", icon: "fa-solid fa-users" },
  { href: "/home", label: "Go to App", icon: "fa-solid fa-house", exact: true },
];

export default function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-tabbar" aria-label="Admin navigation">
      {NAV_ITEMS.map(({ href, label, icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            className={`admin-tabbar__item${active ? " admin-tabbar__item--active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <i className={icon} aria-hidden="true" />
            <span className="admin-tabbar__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
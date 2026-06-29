// components/layout/BottomNav.js
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// usePathname is a Next.js built-in, not a custom hook — safe to keep.
// Badge count is hardcoded for now; replace with real data later.
const ALERT_COUNT = 4;

const NAV_ITEMS = [
  { href: "/home",    label: "Home",    icon: "fa-solid fa-house" },
  { href: "/alerts",  label: "Alerts",  icon: "fa-solid fa-bell",       badge: true },
  { href: "/report-list", label: "Reports", icon: "fa-solid fa-file-lines" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="bottom-nav" aria-label="Main navigation">
        <ul className="bottom-nav__list">
          {NAV_ITEMS.map(({ href, label, icon, badge }) => {
            const active = pathname.startsWith(href);
            const count  = badge ? ALERT_COUNT : 0;

            return (
              <li key={href} className="bottom-nav__item">
                <Link
                  href={href}
                  className={`bottom-nav__link${active ? " bottom-nav__link--active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="bottom-nav__icon-wrap">
                    <i className={icon} aria-hidden="true" />
                    {count > 0 && (
                      <span className="bottom-nav__badge" aria-label={`${count} unread alerts`}>
                        {count > 9 ? "9+" : count}
                      </span>
                    )}
                  </span>
                  <span className="bottom-nav__label">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
  
        {/* Floating camera button */}
        <Link href="/report" className="fab-camera" aria-label="Report a hazard">
          <i className="fa-solid fa-camera" aria-hidden="true" />
        </Link>
      </nav>

    </>
  );
}
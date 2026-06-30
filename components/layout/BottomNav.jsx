// components/layout/BottomNav.js
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import imageCompression from "browser-image-compression";

// usePathname is a Next.js built-in, not a custom hook — safe to keep.
// Badge count is hardcoded for now; replace with real data later.
const ALERT_COUNT = 4;

// Key used to hand the captured photo off to the /report page via
// sessionStorage, since Next.js navigation doesn't carry in-memory state.
const PENDING_PHOTO_KEY = "pendingReportPhoto";

const NAV_ITEMS = [
  { href: "/home",    label: "Home",    icon: "fa-solid fa-house" },
  { href: "/alerts",  label: "Alerts",  icon: "fa-solid fa-bell",       badge: true },
  { href: "/report-list", label: "Reports", icon: "fa-solid fa-file-lines" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const cameraInputRef = useRef(null);

  const handleCameraCapture = async (e) => {
    const file = e.target.files[0];
    // Reset so selecting the same file again later still fires onChange.
    e.target.value = "";
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      });
      const dataUrl = await imageCompression.getDataUrlFromFile(compressed);
      sessionStorage.setItem(
        PENDING_PHOTO_KEY,
        JSON.stringify({ dataUrl, mimeType: compressed.type }),
      );
    } catch (err) {
      console.error("Failed to process captured photo", err);
      // Fall through and still navigate — ReportUpload will just show
      // its empty upload state if nothing made it into sessionStorage.
    }

    router.push("/report");
  };

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
  
        {/* Floating camera button — opens the native camera directly */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="fab-camera"
          aria-label="Report a hazard"
        >
          <i className="fa-solid fa-camera" aria-hidden="true" />
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleCameraCapture}
        />
      </nav>

    </>
  );
}
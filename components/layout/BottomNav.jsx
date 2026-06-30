// components/layout/BottomNav.jsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import imageCompression from "browser-image-compression";
import { useAuth } from "@/hooks/useAuth";

// Key used to hand the captured photo off to the /report page via
// sessionStorage, since Next.js navigation doesn't carry in-memory state.
const PENDING_PHOTO_KEY = "pendingReportPhoto";

// Tabs are additive by role — each role gets everything the previous,
// less-privileged role gets, plus one more tab.
//   public:    Home, Community
//   responder: Home, Community, Reports
//   engineer:  Home, Community, Reports, Incidents
const ALL_NAV_ITEMS = [
  { href: "/home",      label: "Home",      icon: "fa-solid fa-house",                  roles: ["public", "responder", "engineer"] },
  { href: "/community", label: "Community", icon: "fa-solid fa-bullhorn",               roles: ["public", "responder", "engineer"] },
  { href: "/reports",   label: "Reports",   icon: "fa-solid fa-file-lines",             roles: ["responder", "engineer"] },
  { href: "/incidents", label: "Incidents", icon: "fa-solid fa-triangle-exclamation",   roles: ["engineer"] },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const cameraInputRef = useRef(null);
  const { role, loading } = useAuth();

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

  // Avoid flashing tabs before role resolves. The parent layout.js already
  // handles the full-screen loading state, so returning null here just
  // keeps the nav slot empty for that brief moment.
  if (loading) return null;

  const NAV_ITEMS = ALL_NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <>
      <nav className="bottom-nav" aria-label="Main navigation">
        <ul className="bottom-nav__list">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);

            return (
              <li key={href} className="bottom-nav__item">
                <Link
                  href={href}
                  className={`bottom-nav__link${active ? " bottom-nav__link--active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="bottom-nav__icon-wrap">
                    <i className={icon} aria-hidden="true" />
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
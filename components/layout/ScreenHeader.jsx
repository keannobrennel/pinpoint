// components/layout/ScreenHeader.jsx
// Back arrow + title row used by all detail and wizard screens.
// Report Details, Incident Details, Structural Assessment, Activity, etc.
//
// Usage:
//   <ScreenHeader title="Report Details" />
//   <ScreenHeader title="Structural Assessment" onBack={() => router.push("/incidents")} />
//
// By default onBack calls router.back(). Pass a custom onBack when you
// need to go to a specific route instead (e.g. wizard cancel → /incidents).

"use client";

import { useRouter } from "next/navigation";

export default function ScreenHeader({ title, onBack, action }) {
  const router = useRouter();

  return (
    <div className="screen-header">
      <button
        type="button"
        className="screen-header__back"
        onClick={onBack ?? (() => router.back())}
        aria-label="Go back"
      >
        <i className="fa-solid fa-arrow-left" aria-hidden="true" />
      </button>

      <span className="screen-header__title">{title}</span>

      {/* Optional right-side action (e.g. info icon on STA screens) */}
      {action ? (
        <div className="screen-header__action">{action}</div>
      ) : (
        <div className="screen-header__action" />
      )}
    </div>
  );
}
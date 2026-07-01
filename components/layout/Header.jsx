// components/layout/Header.js
"use client";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header
      className="pinpoint-header"
      style={{
        // Explicit opaque background — Header now renders directly on top
        // of the map (inside home-page__top-overlay), so any transparency
        // in .pinpoint-header's own CSS becomes very visible (the map
        // shows through). Setting it here guarantees a solid header
        // regardless of what the CSS class does or doesn't define.
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Logo */}
      <div className="header-logo">
        <Image
            src="/pinpoint-logo-pin.png"
            alt="PinPoint pin icon"
            width={54}
            height={54}
            priority
            className="logo-pin"
            style={{ height: 'auto' }}
        />
        <div className="logo-text-wrap">
          <h1 className="logo-text">PinPoint</h1>
          <span className="logo-tagline">Flag Hazards. Drive Action</span>
        </div>
      </div>
      <div>
        <i className="fa-regular fa-bell fa-2xl" style={{ color: "rgb(42, 102, 151)" }}></i>
        {/* Static avatar placeholder — swap src when auth is wired */}
        <button className="header-avatar" aria-label="Open profile">
          <span className="avatar-fallback">U</span>
        </button>
      </div>
    </header>
  );
}
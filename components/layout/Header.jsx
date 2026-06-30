// components/layout/Header.js
"use client";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="pinpoint-header">
      {/* Logo */}
      <div className="header-logo">
        <Image
            src="/pinpoint-logo-pin.png"
            alt="PinPoint pin icon"
            width={54}
            height={54}
            priority
            className="logo-pin"
        />
        <div className="logo-text-wrap">
          <h1 className="logo-text">PinPoint</h1>
          <span className="logo-tagline">Flag Hazards. Drive Action</span>
        </div>
      </div>

      {/* Static avatar placeholder — swap src when auth is wired */}
      <button className="header-avatar" aria-label="Open profile">
        <span className="avatar-fallback">U</span>
      </button>
    </header>
  );
}
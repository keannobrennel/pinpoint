// components/layout/Header.js
"use client";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

// Generic person-silhouette icon shown when the user has no profile photo.
function DefaultAvatarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="60%"
      height="60%"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" fill="#fff" fillOpacity="0.9" />
      <path
        d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7"
        fill="#fff"
        fillOpacity="0.9"
      />
    </svg>
  );
}

export default function Header() {
  const { user } = useAuth();

  // Field names guessed to match how `user` is already used elsewhere
  // (page.js reads `user?.name`). If your useAuth hook exposes the photo
  // under a different key (e.g. `photoUrl`), add it to this list.
  const displayName = user?.name ?? user?.displayName ?? "";
  const photoURL = user?.photoURL ?? user?.photoUrl ?? user?.avatarUrl ?? null;

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
          style={{ height: "auto" }}
        />
        <div className="logo-text-wrap">
          <h1 className="logo-text">PinPoint</h1>
          <span className="logo-tagline">Flag Hazards. Drive Action</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <i
          className="fa-regular fa-bell fa-2xl"
          style={{ color: "rgb(42, 102, 151)" }}
        ></i>
        <Link href="/profile" className="header-avatar" aria-label="Open profile">
          {photoURL ? (
            <Image
              src={photoURL}
              alt={displayName || "Profile photo"}
              width={47}
              height={47}
              className="avatar-img"
            />
          ) : (
            <span className="avatar-fallback">
              <DefaultAvatarIcon />
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
// components/layout/Header.js
"use client";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { user } = useAuth();

  // Field names guessed to match how `user` is already used elsewhere
  // (page.js reads `user?.name`). If your useAuth hook exposes the photo
  // under a different key (e.g. `photoUrl`), add it to this list.
  //
  // Same fallback as app/(detail)/profile/page.js: default to "User" so we
  // never end up computing an initial from an empty string.
  const displayName = user?.name ?? user?.displayName ?? "User";
  const photoURL = user?.photoURL ?? user?.photoUrl ?? user?.avatarUrl ?? null;

  // Fallback shown when there's no profile photo: first letter of the
  // user's display name (uppercased). Matches getInitial() in
  // app/(detail)/profile/page.js.
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "U";

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

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

        {/* User activity icon — opens the signed-in user's own report
            history / status (app/(app)/activity/page.js). */}
        <Link
          href="/activity"
          aria-label="View your activity"
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          <i
            className="fa-solid fa-clipboard-list fa-2xl"
            style={{ color: "#7a8aab" }}
          ></i>
        </Link>

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
            <span className="avatar-fallback" aria-hidden="true">
              {avatarInitial}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
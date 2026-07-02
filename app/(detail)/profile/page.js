// app/(detail)/profile/page.js
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { formatRole } from "@/lib/roles";
import "@/styles/profile.css";

function getInitial(name) {
  const trimmed = (name ?? "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "U";
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(null);

  // Same field-name assumptions as Header.jsx — keep these two in sync if
  // your useAuth hook's user shape changes.
  const displayName = user?.name ?? user?.displayName ?? "User";
  const photoURL = user?.photoURL ?? user?.photoUrl ?? user?.avatarUrl ?? null;
  const email = user?.email ?? null;
  const initial = getInitial(displayName);

  const handleSignOut = async () => {
    if (isSigningOut) return; // guard against double-clicks
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (err) {
      console.error("[ProfilePage] sign out failed:", err);
      setSignOutError("Sign out failed. Please try again.");
      setIsSigningOut(false);
    }
  };

  return (
    <div className="detail-screen">
      <ScreenHeader
        title="My Profile"
        onBack={() => router.push("/home")}
        action={
          <button
            type="button"
            className="profile-page__edit-link"
            onClick={() => router.push("/profile/edit")}
          >
            Edit
          </button>
        }
      />

      {/* City skyline hero + avatar card. The avatar itself is positioned
          absolutely so only its bottom half sits over the white card —
          the top half (and sides) stay over the city skyline behind it. */}
      <div className="profile-page__hero-wrap">
        <div className="profile-page__hero" aria-hidden="true">
          <img src="/images/city2.png" alt="" className="profile-page__city profile-page__city--left" />
          <img src="/images/city2.png" alt="" className="profile-page__city profile-page__city--right" />
        </div>

        <div className="detail-screen__card profile-page__avatar-card">
          <h2 className="profile-page__name">{displayName}</h2>
          {email ? <p className="profile-page__email">{email}</p> : null}
          {role ? (
            <>
              <span className="profile-page__role-badge">
                <span className="profile-page__role-badge-icon" aria-hidden="true">
                  👤
                </span>
                {formatRole(role)}
              </span>
              <p className="profile-page__role-caption">Account Type</p>
            </>
          ) : null}
        </div>

        <div className="profile-page__avatar-photo-wrap">
          {photoURL ? (
            <Image
              src={photoURL}
              alt={displayName}
              width={140}
              height={140}
              className="profile-page__avatar-image"
            />
          ) : (
            <div className="profile-page__avatar-fallback" aria-hidden="true">
              {initial}
            </div>
          )}
        </div>
      </div>

      {/* Static nav rows — no routes yet, wired up as stubs */}
      <div className="detail-screen__card">
        <button type="button" className="profile-page__nav-row">
          Help &amp; Support
          <span className="profile-page__nav-chevron" aria-hidden="true">
            ›
          </span>
        </button>
        <button type="button" className="profile-page__nav-row">
          About PinPoint
          <span className="profile-page__nav-chevron" aria-hidden="true">
            ›
          </span>
        </button>
      </div>

      {/* Action button */}
      <div className="detail-screen__footer">
        {signOutError ? (
          <p className="profile-page__signout-error" role="alert">
            {signOutError}
          </p>
        ) : null}
        <button
          type="button"
          className="detail-screen__action-btn detail-screen__action-btn--danger"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </div>
  );
}
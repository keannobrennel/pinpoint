// app/(detail)/profile/page.js
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import ScreenHeader from "@/components/layout/ScreenHeader";
import MetadataTable from "@/components/ui/MetadataTable";
import { formatRole } from "@/lib/roles";
import "@/styles/profile.css";

function getInitial(name) {
  const trimmed = (name ?? "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "U";
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, role } = useAuth();

  // Same field-name assumptions as Header.jsx — keep these two in sync if
  // your useAuth hook's user shape changes.
  const displayName = user?.name ?? user?.displayName ?? "User";
  const photoURL = user?.photoURL ?? user?.photoUrl ?? user?.avatarUrl ?? null;
  const email = user?.email ?? null;
  const initial = getInitial(displayName);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (err) {
      console.error("[ProfilePage] sign out failed:", err);
    }
  };

  const metaRows = [
    { label: "Email", value: email ?? "—" },
    ...(role ? [{ label: "Role", value: formatRole(role) }] : []),
  ];

  return (
    <div className="detail-screen">
      <ScreenHeader title="My Profile" onBack={() => router.push("/home")} />

      {/* Avatar card — profile-specific, no equivalent in detail-screen */}
      <div className="detail-screen__card profile-page__avatar-card">
        {photoURL ? (
          <Image
            src={photoURL}
            alt={displayName}
            width={96}
            height={96}
            className="profile-page__avatar-image"
          />
        ) : (
          <div className="profile-page__avatar-fallback" aria-hidden="true">
            {initial}
          </div>
        )}
        <h2 className="profile-page__name">{displayName}</h2>
        {role ? (
          <span className="profile-page__role-badge">{formatRole(role)}</span>
        ) : null}
      </div>

      {/* Account details card */}
      <div className="detail-screen__card">
        <MetadataTable rows={metaRows} />
      </div>

      {/* Action button */}
      <div className="detail-screen__footer">
        <button
          type="button"
          className="detail-screen__action-btn detail-screen__action-btn--danger"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
// app/(detail)/profile/edit/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// NOTE: assumes `storage` is exported from lib/firebase alongside `auth`
// (standard Firebase Storage setup). Adjust the import if your setup differs.
import { auth, storage } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { formatRole } from "@/lib/roles";
import "@/styles/profile.css";

function getInitial(name) {
  const trimmed = (name ?? "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "U";
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, role } = useAuth();

  const initialName = user?.name ?? user?.displayName ?? "";
  const initialPhoto = user?.photoURL ?? user?.photoUrl ?? user?.avatarUrl ?? null;
  const email = user?.email ?? null;

  const [name, setName] = useState(initialName);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(initialPhoto);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const initial = getInitial(name);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let photoURL = initialPhoto;

      if (photoFile) {
        const avatarRef = ref(storage, `avatars/${auth.currentUser.uid}`);
        await uploadBytes(avatarRef, photoFile);
        photoURL = await getDownloadURL(avatarRef);
      }

      await updateProfile(auth.currentUser, {
        displayName: name.trim() || null,
        photoURL,
      });

      router.push("/profile");
    } catch (err) {
      console.error("[ProfileEditPage] update failed:", err);
      setError("Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="detail-screen">
      <ScreenHeader title="Edit Profile" onBack={() => router.push("/profile")} />

      {/* City skyline hero + avatar card. The avatar itself is positioned
          absolutely so only its bottom half sits over the white card —
          the top half (and sides) stay over the city skyline behind it. */}
      <div className="profile-page__hero-wrap">
        <div className="profile-page__hero" aria-hidden="true">
          <img src="/images/city2.png" alt="" className="profile-page__city profile-page__city--left" />
          <img src="/images/city2.png" alt="" className="profile-page__city profile-page__city--right" />
        </div>

        <div className="detail-screen__card profile-page__avatar-card">
          <input
            type="text"
            className="profile-page__name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
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

          {error ? <p className="profile-page__field-error">{error}</p> : null}
        </div>

        <div className="profile-page__avatar-photo-wrap">
          <div className="profile-page__avatar-wrap">
            {photoPreview ? (
              <img src={photoPreview} alt={name} className="profile-page__avatar-image" />
            ) : (
              <div className="profile-page__avatar-fallback" aria-hidden="true">
                {initial}
              </div>
            )}
            <label htmlFor="avatar-upload" className="profile-page__avatar-overlay">
              <i className="fa-solid fa-camera" aria-hidden="true" />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="profile-page__avatar-file-input"
              onChange={handlePhotoChange}
            />
          </div>
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
        <button
          type="button"
          className="detail-screen__action-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
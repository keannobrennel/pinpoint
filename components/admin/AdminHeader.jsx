"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { signOut as firebaseSignOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";

const PAGE_TITLES = {
  "/admin": "Dashboard",
  "/admin/users": "Users",
};

export default function AdminHeader() {
  const { user, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  async function handleSignOut() {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error("Sign out failed", err);
    }
    router.push("/login");
  }

  const displayName = user?.displayName || user?.email || "Admin";
  const initial = displayName.charAt(0).toUpperCase();
  const matchedTitleKey = Object.keys(PAGE_TITLES).find(
    (key) => pathname === key || pathname.startsWith(`${key}/`)
  );
  const pageTitle = matchedTitleKey ? PAGE_TITLES[matchedTitleKey] : "Admin";

  return (
    <header className="admin-header">
      <div className="admin-header__brand">
        <div className="admin-header__brand-mark">
          <Image src="/pinpoint-logo-pin.png" alt="PinPoint logo" width={32} height={32} priority />
        </div>
        <div className="admin-header__brand-text">
          <p className="admin-header__brand-title">PinPoint Admin</p>
          <h1 className="admin-header__page-title">{pageTitle}</h1>
        </div>
      </div>

      <div className="admin-header__profile" ref={containerRef}>
        <button type="button" className="admin-header__notify" aria-label="View notifications">
          <i className="fa-regular fa-bell" aria-hidden="true" />
          <span className="admin-header__notify-badge">4</span>
        </button>

        <button
          type="button"
          className="admin-header__avatar"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Open profile menu"
        >
          <span>{initial}</span>
        </button>

        {menuOpen && (
          <div className="admin-header__dropdown">
            <div className="admin-header__dropdown-info">
              <p className="admin-header__dropdown-name">{displayName}</p>
              <p className="admin-header__dropdown-role">{role || "admin"}</p>
            </div>
            <button type="button" className="admin-header__dropdown-item" onClick={handleSignOut}>
              <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
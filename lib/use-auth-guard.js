"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/**
 * Gates a page behind Firebase Auth + a Firestore-stored role.
 *
 * Usage:
 *   const { profile, status } = useAuthGuard(["engineer", "admin"]);
 *   if (status !== "ready") return null; // hook already redirected if needed
 *
 * status: "checking" | "ready" | "denied"
 * - "checking": still resolving auth/profile, render nothing (or a loading state)
 * - "ready": profile loaded and role is allowed, safe to render the page
 * - "denied": redirect already triggered, render nothing
 *
 * Redirects:
 * - No authenticated user -> /login
 * - Authenticated but role not allowed -> /
 */
export function useAuthGuard(allowedRoles = ["engineer", "admin"]) {
  const router = useRouter();
  const [status, setStatus] = useState("checking");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      console.log(
        "[useAuthGuard] onAuthStateChanged fired. user:",
        user?.uid ?? null,
      );

      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (!user) {
        console.log("[useAuthGuard] no user -> redirecting to /login");
        setStatus("denied");
        router.replace("/login");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      unsubProfile = onSnapshot(
        userRef,
        (snap) => {
          console.log(
            "[useAuthGuard] profile snapshot. exists:",
            snap.exists(),
            "data:",
            snap.data(),
          );

          if (!snap.exists()) {
            console.log("[useAuthGuard] no profile doc -> redirecting to /");
            setStatus("denied");
            router.replace("/");
            return;
          }

          const data = snap.data();
          console.log(
            "[useAuthGuard] role check. data.role:",
            JSON.stringify(data.role),
            "allowedRoles:",
            allowedRoles,
          );

          if (!allowedRoles.includes(data.role)) {
            console.log("[useAuthGuard] role not allowed -> redirecting to /");
            setStatus("denied");
            router.replace("/");
            return;
          }

          console.log("[useAuthGuard] role OK -> ready");
          setProfile({ uid: user.uid, ...data });
          setStatus("ready");
        },
        (err) => {
          console.log("[useAuthGuard] onSnapshot ERROR:", err);
          setStatus("denied");
          router.replace("/");
        },
      );
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return { profile, status };
}

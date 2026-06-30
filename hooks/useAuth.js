// hooks/useAuth.js
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// Reads role from Firestore (collection: "users"), not from ID token
// custom claims. Custom claims are never set during login/signup in
// this project — the Firestore doc is the single source of truth for role.
export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up any previous Firestore listener when auth state changes.
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      const userRef = doc(db, "users", firebaseUser.uid);
      unsubProfile = onSnapshot(
        userRef,
        (snap) => {
          if (snap.exists()) {
            setRole(snap.data().role ?? "public");
          } else {
            setRole("public");
          }
          setLoading(false);
        },
        (err) => {
          console.error("[useAuth] onSnapshot error:", err);
          setRole("public");
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return { user, role, loading };
}
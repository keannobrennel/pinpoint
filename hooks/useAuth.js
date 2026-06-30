import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      const tokenResult = await firebaseUser.getIdTokenResult();
      setUser(firebaseUser);
      setRole(tokenResult.claims.role ?? "citizen");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, role, loading };
}

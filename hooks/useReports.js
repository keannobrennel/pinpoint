import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

/**
 * Citizen mode (role !== "engineer"/"admin"):
 *   - own reports (live, via Firestore listener on submittedBy == uid)
 *   - zones (public, via /api/zones) for counts + officialVerdict
 *
 * Engineer/admin mode:
 *   - all reports (live, via Firestore listener, no submittedBy filter)
 */
export function useReports(role) {
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const isStaff = role === "engineer" || role === "admin";

  // reports listener
  useEffect(() => {
    const user = auth.currentUser;
    if (!isStaff && !user) {
      setReports([]);
      return;
    }

    const reportsRef = collection(db, "reports");
    const q = isStaff
      ? reportsRef
      : query(reportsRef, where("submittedBy", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [isStaff, auth.currentUser]);

  // zones — fetched via API (public for counts/verdict, full detail for staff)
  useEffect(() => {
    let cancelled = false;

    async function fetchZones() {
      setLoading(true);
      try {
        const res = await fetch("/api/zones");
        const data = await res.json();
        if (!cancelled) setZones(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchZones();
    return () => {
      cancelled = true;
    };
  }, []);

  return { reports, zones, loading };
}

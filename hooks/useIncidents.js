"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Live-subscribes to the "incidents" collection (see lib/schemas.js for the
 * Incident shape). Incidents are only ever staff-facing (clustered from
 * verified reports for engineer assessment — see seed-incidents.js), so
 * unlike useReports.js there's no citizen/own-incidents branch: this
 * always lists everything.
 *
 * Usage:
 *   const { incidents, loading } = useIncidents();
 */
export function useIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const incidentsRef = collection(db, "incidents");

    const unsubscribe = onSnapshot(
      incidentsRef,
      (snap) => {
        setIncidents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("[useIncidents] onSnapshot error:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { incidents, loading };
}
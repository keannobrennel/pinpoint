"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Subscribes to the "reports" collection in real time, newest first.
 * Returns every report regardless of status — filtering by status
 * happens client-side in the dashboard UI, not here, so the toggle
 * doesn't require re-subscribing.
 */
export function useReportsFeed() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  return { reports, loading, error };
}

/**
 * Subscribes to the "zones" collection in real time, highest priority first.
 */
export function useZonesFeed() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "zones"), orderBy("priorityScore", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setZones(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  return { zones, loading, error };
}

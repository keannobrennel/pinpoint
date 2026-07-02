"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
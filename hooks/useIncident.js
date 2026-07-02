"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useIncident(id) {
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const incidentRef = doc(db, "incidents", id);

    const unsubscribe = onSnapshot(
      incidentRef,
      async (snap) => {
        if (!snap.exists()) {
          setIncident(null);
          setError("not-found");
          setLoading(false);
          return;
        }

        const data = { id: snap.id, ...snap.data() };
        const reportIds = data.reportIds ?? [];

        try {
          const reports = await Promise.all(
            reportIds.map(async (reportId) => {
              const reportSnap = await getDoc(doc(db, "reports", reportId));
              if (!reportSnap.exists()) return null;

              const report = { id: reportSnap.id, ...reportSnap.data() };

              if (report.submittedBy) {
                try {
                  const userSnap = await getDoc(doc(db, "users", report.submittedBy));
                  report.submittedByName = userSnap.exists()
                    ? (userSnap.data().displayName ?? null)
                    : null;
                } catch (err) {
                  console.error("[useIncident] submitter lookup failed:", err);
                  report.submittedByName = null;
                }
              } else {
                report.submittedByName = null;
              }

              return report;
            }),
          );

          data.reports = reports.filter(Boolean);
        } catch (err) {
          console.error("[useIncident] member report lookup failed:", err);
          data.reports = [];
        }

        setIncident(data);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("[useIncident] onSnapshot error:", err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [id]);

  return { incident, loading, error };
}
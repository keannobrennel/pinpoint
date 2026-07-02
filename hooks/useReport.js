"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Live-subscribes to a single report doc by id (collection: "reports"),
 * and resolves submittedBy (a uid) into a display name via the "users"
 * collection, exposed as report.submittedByName.
 *
 * NOTE: this requires responder/engineer accounts to have Firestore read
 * permission on OTHER users' profile docs (use-auth-guard.js only ever
 * reads the signed-in user's own doc, so double check your security rules
 * allow this before relying on it). If the lookup fails (e.g. rules deny
 * it, or the user doc was deleted), submittedByName falls back to null
 * and the uid is shown instead — see the "Reported by" row in page.js.
 *
 * Longer-term, consider denormalizing the submitter's displayName onto
 * the report doc at submission time instead (same pattern already used
 * for verifiedByName) — that avoids the extra read + permission surface
 * entirely.
 *
 * Usage:
 *   const { report, loading, error } = useReport(id);
 *
 * error:
 *   - null          -> no error
 *   - "not-found"   -> doc doesn't exist (matches the check already in
 *                       app/(detail)/reports/[id]/page.js)
 *   - Error         -> Firestore/permissions error (e.g. rules reject read)
 */
export function useReport(id) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const reportRef = doc(db, "reports", id);

    const unsubscribe = onSnapshot(
      reportRef,
      async (snap) => {
        if (!snap.exists()) {
          setReport(null);
          setError("not-found");
          setLoading(false);
          return;
        }

        const data = { id: snap.id, ...snap.data() };

        if (data.submittedBy) {
          try {
            const userSnap = await getDoc(doc(db, "users", data.submittedBy));
            data.submittedByName = userSnap.exists()
              ? (userSnap.data().displayName ?? null)
              : null;
          } catch (err) {
            console.error("[useReport] submitter lookup failed:", err);
            data.submittedByName = null;
          }
        } else {
          data.submittedByName = null;
        }

        setReport(data);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("[useReport] onSnapshot error:", err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [id]);

  return { report, loading, error };
}
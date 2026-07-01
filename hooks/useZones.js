'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Real-time listener on the `zones` Firestore collection.
 * Only fetches zones with at least one report — empty zones carry no heatmap weight.
 *
 * Zones are public-read (no auth required):
 *   match /zones/{zoneId} { allow read: if true; }
 *
 * @returns {{
 *   zones: Array<Object>,
 *   loading: boolean,
 *   error: Error | null
 * }}
 */
export function useZones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only stream zones that have at least one accepted report.
    // Zones with reportCount === 0 have no heatmap weight and no
    // engineer verdict to show — filtering them out here reduces
    // unnecessary renders and Firestore read costs.
    const zonesQuery = query(
      collection(db, 'zones'),
      where('reportCount', '>', 0)
    );

    const unsubscribe = onSnapshot(
      zonesQuery,
      (snapshot) => {
        const zoneData = snapshot.docs.map((doc) => ({
          // Use Firestore document ID as the canonical zone identifier.
          // A separate `zoneId` field is not assumed to exist.
          id: doc.id,
          ...doc.data(),
        }));
        setZones(zoneData);
        setLoading(false);
      },
      (err) => {
        console.error('[useZones] Firestore snapshot error:', err);
        setError(err);
        setLoading(false);
      }
    );

    // Critical: clean up the listener on unmount. Without this, navigating
    // away and back adds a new listener each time, causing duplicate state
    // updates and memory leaks.
    return () => unsubscribe();
  }, []);

  return { zones, loading, error };
}

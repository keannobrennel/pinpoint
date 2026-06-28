/**
 * lib/firebase.js
 *
 * Client-side Firebase SDK init. Safe to import from client components
 * ("use client") and from client-side hooks. Do NOT use this for
 * server-side role enforcement — that's lib/firebase-admin.js.
 *
 * Env vars expected in .env.local (all public/client-exposed by Next.js
 * convention since they're prefixed NEXT_PUBLIC_):
 *
 *   NEXT_PUBLIC_FIREBASE_API_KEY=
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
 *   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
 *   NEXT_PUBLIC_FIREBASE_APP_ID=
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Next.js hot-reloads modules in dev, which can re-run initializeApp()
// and throw "duplicate app" errors. getApps()/getApp() guards against that.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

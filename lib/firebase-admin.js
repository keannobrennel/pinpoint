import { cert, initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);

const app = getApps().length
  ? getApp()
  : initializeApp({ credential: cert(serviceAccount) });

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);

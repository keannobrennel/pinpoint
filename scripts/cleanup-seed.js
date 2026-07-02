// scripts/cleanup-seed.js
//
// Deletes mock seed data created by scripts/seed-reports.js.
// Run with the same service account JSON env var as the seed script:
//   node --env-file=.env.local scripts/cleanup-seed.js

const { cert, initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);
const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);
const auth = getAuth(app);

const TEST_RESPONDER_EMAIL = 'test.responder@pinpoint.dev';
const SEEDED_REPORT_IDS = [
  'seed-pending-pre',
  'seed-pending-post',
  'seed-auto-verified-post',
  'seed-responder-verified-pre',
  'seed-responder-verified-post',
  'seed-verified-false-pre',
  'seed-verified-false-post',
  'seed-pending-pre-2',
];

async function deleteReports() {
  console.log('[cleanup] Deleting seeded report docs...');
  const deletePromises = SEEDED_REPORT_IDS.map((id) =>
    db.collection('reports').doc(id).delete().then(() => {
      console.log(`  deleted reports/${id}`);
    }).catch((err) => {
      if (err.code === 5 || err.code === 'not-found') {
        console.log(`  reports/${id} not found, skipping`);
      } else {
        throw err;
      }
    })
  );
  await Promise.all(deletePromises);
}

async function deleteTestUser() {
  try {
    const userRecord = await auth.getUserByEmail(TEST_RESPONDER_EMAIL);
    const uid = userRecord.uid;
    console.log(`[cleanup] Deleting auth user ${TEST_RESPONDER_EMAIL} (${uid})`);
    await auth.deleteUser(uid);
    console.log(`[cleanup] Deleted Firebase Auth user ${uid}`);
    await db.collection('users').doc(uid).delete();
    console.log(`[cleanup] Deleted users/${uid} Firestore document`);
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 5 || err.code === 'not-found') {
      console.log(`[cleanup] Auth user ${TEST_RESPONDER_EMAIL} not found, skipping`);
    } else {
      throw err;
    }
  }
}

async function main() {
  console.log('[cleanup] Starting seeded data cleanup');
  await deleteReports();
  await deleteTestUser();
  console.log('[cleanup] Seed cleanup complete');
}

main().catch((err) => {
  console.error('[cleanup] Failed:', err);
  process.exit(1);
});

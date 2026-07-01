import { adminDb } from "@/lib/firebase-admin";

// GET /api/zones — fetch all zones (public)
export async function GET() {
  const snap = await adminDb.collection("zones").get();
  const zones = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return new Response(JSON.stringify(zones), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

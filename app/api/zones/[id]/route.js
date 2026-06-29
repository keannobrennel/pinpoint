import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

// GET /api/zones/[id] — fetch a single zone with its reports
export async function GET(request, { params }) {
  const doc = await adminDb.collection("zones").doc(params.id).get();

  if (!doc.exists) {
    return new Response(JSON.stringify({ error: "Zone not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const reportsSnap = await adminDb
    .collection("reports")
    .where("zoneId", "==", params.id)
    .orderBy("priorityScore", "desc")
    .get();

  const reports = reportsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return new Response(JSON.stringify({ id: doc.id, ...doc.data(), reports }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// PATCH /api/zones/[id] — update zone info (admin only)
export async function PATCH(request, { params }) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();

  await adminDb.collection("zones").doc(params.id).update(body);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

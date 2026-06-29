import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

// GET /api/reports/[id] — fetch a single report
export async function GET(request, { params }) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  const doc = await adminDb.collection("reports").doc(params.id).get();

  if (!doc.exists) {
    return new Response(JSON.stringify({ error: "Report not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ id: doc.id, ...doc.data() }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// PATCH /api/reports/[id] — engineer posts official verdict
export async function PATCH(request, { params }) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (user.role !== "engineer" && user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const { engineerVerdict, status } = body;

  if (!engineerVerdict || !status) {
    return new Response(
      JSON.stringify({ error: "Missing verdict or status" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  await adminDb.collection("reports").doc(params.id).update({
    engineerVerdict,
    status,
    verifiedBy: user.uid,
    verifiedAt: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

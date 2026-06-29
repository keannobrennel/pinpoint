import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

// POST /api/zones/[id]/disaster-mode — toggle disaster mode (admin only)
export async function POST(request, { params }) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const { enabled } = body;

  if (typeof enabled !== "boolean") {
    return new Response(JSON.stringify({ error: "Missing enabled boolean" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await adminDb.collection("zones").doc(params.id).update({
    disasterMode: enabled,
    disasterModeUpdatedAt: new Date().toISOString(),
    disasterModeUpdatedBy: user.uid,
  });

  return new Response(
    JSON.stringify({ success: true, disasterMode: enabled }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

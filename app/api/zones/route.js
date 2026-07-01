import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

// GET /api/zones — fetch all zones (public)
export async function GET() {
  const snap = await adminDb.collection("zones").get();
  const zones = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return new Response(JSON.stringify(zones), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// POST /api/zones — create a zone (admin only)
export async function POST(request) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const { name, boundaries, barangay, city } = body;

  if (!name || !boundaries) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const zone = {
    name,
    boundaries,
    barangay: barangay ?? null,
    city: city ?? null,
    disasterMode: false,
    createdAt: new Date().toISOString(),
  };

  const docRef = await adminDb.collection("zones").add(zone);

  return new Response(JSON.stringify({ id: docRef.id, ...zone }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

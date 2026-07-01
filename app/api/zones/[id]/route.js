import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

// GET /api/zones/[id] — fetch a single zone
// Public: zone info + report count only.
// Engineer/admin: zone info + full reports list.
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

  const user = await verifyAuth(request);
  const isStaff = user?.role === "engineer" || user?.role === "admin";

  if (isStaff) {
    const reports = reportsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return new Response(
      JSON.stringify({
        id: doc.id,
        ...doc.data(),
        reportCount: reportsSnap.size,
        reports,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // public/citizen: no individual report details
  return new Response(
    JSON.stringify({
      id: doc.id,
      ...doc.data(),
      reportCount: reportsSnap.size,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

// PATCH /api/zones/[id] — update zone info, or post/update official verdict
// Plain field updates: admin only.
// Verdict updates (body.verdict present): engineer or admin.
export async function PATCH(request, { params }) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  const body = await request.json();
  const zoneRef = adminDb.collection("zones").doc(params.id);

  if (body.verdict) {
    if (user.role !== "engineer" && user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { placard, reasoning, alertBannerMessage } = body.verdict;
    if (!placard) {
      return new Response(JSON.stringify({ error: "Missing placard" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const postedAt = new Date().toISOString();
    const doc = await zoneRef.get();
    const prevHistory = doc.data()?.verdictHistory ?? [];

    // archive the previous verdict (if any) into history before overwriting
    const updatedHistory = doc.data()?.officialVerdict
      ? [
          ...prevHistory,
          {
            placard: doc.data().officialVerdict,
            reasoning: doc.data().verdictReasoning ?? null,
            postedBy: doc.data().verdictPostedBy ?? null,
            postedAt: doc.data().verdictPostedAt ?? null,
          },
        ]
      : prevHistory;

    await zoneRef.update({
      officialVerdict: placard,
      verdictReasoning: reasoning ?? null,
      alertBannerMessage: alertBannerMessage ?? null,
      verdictPostedBy: user.uid,
      verdictPostedAt: postedAt,
      verdictHistory: updatedHistory,
      updatedAt: postedAt,
    });

    return new Response(JSON.stringify({ success: true, postedAt }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // plain field update — admin only
  if (user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  await zoneRef.update(body);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

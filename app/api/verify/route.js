import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

// GET /api/verify — verify Firebase ID token and return user info
export async function GET(request) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  return new Response(JSON.stringify(user), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

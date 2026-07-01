import { auth } from "@/lib/firebase";

export async function adminFetch(path, options = {}) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw new Error("Not signed in");
  }

  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }

  return data;
}

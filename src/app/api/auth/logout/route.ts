import { clearAdminCookie } from "@/lib/auth";

export async function POST() {
  await clearAdminCookie();
  return Response.json({ ok: true });
}

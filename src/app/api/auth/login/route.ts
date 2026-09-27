import { NextRequest } from "next/server";
import { z } from "zod";
import { authenticateAdmin, createAdminToken, setAdminCookie } from "@/lib/auth";
import { apiError } from "@/lib/http";

const schema = z.object({ email: z.email(), password: z.string().min(1).max(200) });

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    if (!(await authenticateAdmin(body.email, body.password))) {
      return Response.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }
    await setAdminCookie(await createAdminToken(body.email));
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

import { NextRequest } from "next/server";
import { apiError, requestContext } from "@/lib/http";
import { getContractByToken } from "@/lib/contracts";
import { getSupabaseAdmin } from "@/lib/supabase";
import { appendEvent } from "@/lib/audit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const contract = await getContractByToken(token);
    if (contract.status !== "PENDING") throw new Error("El contrato no está pendiente de firma");
    if (!contract.read_at) {
      const now = new Date().toISOString();
      await getSupabaseAdmin().from("contracts").update({ read_at: now, updated_at: now }).eq("id", contract.id);
      await appendEvent({ contractId: contract.id, type: "READ_TO_END", ...requestContext(request) });
    }
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}

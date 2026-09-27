import { NextRequest } from "next/server";
import { apiError, requestContext } from "@/lib/http";
import { getContractByToken } from "@/lib/contracts";
import { getSupabaseAdmin } from "@/lib/supabase";
import { appendEvent } from "@/lib/audit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const contract = await getContractByToken(token);
    const now = new Date().toISOString();
    await getSupabaseAdmin().from("contracts").update({ first_opened_at: contract.first_opened_at || now, last_opened_at: now, view_count: contract.view_count + 1, updated_at: now }).eq("id", contract.id);
    await appendEvent({ contractId: contract.id, type: "LINK_OPENED", ...requestContext(request) });
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}

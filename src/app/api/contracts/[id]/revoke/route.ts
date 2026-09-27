import { NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase";
import { appendEvent } from "@/lib/audit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRequest(request);
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { data, error } = await supabase.from("contracts").update({ status: "REVOKED", token_hash: null, revoked_at: now, updated_at: now }).eq("id", id).in("status", ["READY", "PENDING"]).select("id");
    if (error || !data?.length) throw new Error("Solo se puede revocar un contrato READY o PENDING");
    await appendEvent({ contractId: id, type: "REVOKED" });
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}

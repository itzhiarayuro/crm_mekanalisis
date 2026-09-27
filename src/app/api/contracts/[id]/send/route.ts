import { NextRequest } from "next/server";
import { addDays } from "@/lib/time";
import { requireAdminRequest } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { randomToken, sha256 } from "@/lib/crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { appendEvent } from "@/lib/audit";
import { sendInvitation } from "@/lib/email";
import { APP_URL } from "@/lib/config";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRequest(request);
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data: contract, error } = await supabase.from("contracts").select("*").eq("id", id).single();
    if (error || !contract) throw new Error("Contrato no encontrado");
    if (!['READY', 'PENDING'].includes(contract.status)) throw new Error("El contrato no está listo para enviar");
    if (!contract.signer_email) throw new Error("El cliente no tiene correo. Actualice su ficha antes de enviar a firma");
    const token = randomToken();
    const now = new Date();
    const { error: updateError } = await supabase.from("contracts").update({
      status: "PENDING", token_hash: sha256(token), expires_at: addDays(now, 30).toISOString(),
      otp_hash: null, otp_expires_at: null, otp_attempts: 0, otp_blocked: false,
      read_at: null, verified_at: null, updated_at: now.toISOString(),
    }).eq("id", id);
    if (updateError) throw new Error(updateError.message);
    let emailSent = true;
    try { await sendInvitation(contract.signer_email, contract.signer_name, contract.title, token); }
    catch { emailSent = false; }
    await appendEvent({ contractId: id, type: "SENT", metadata: { emailSent, expiresAt: addDays(now, 30).toISOString() } });
    return Response.json({ ok: true, emailSent, url: `${APP_URL}/sign/${token}` });
  } catch (error) { return apiError(error); }
}

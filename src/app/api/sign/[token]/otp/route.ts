import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, requestContext } from "@/lib/http";
import { getContractByToken } from "@/lib/contracts";
import { getSupabaseAdmin } from "@/lib/supabase";
import { appendEvent } from "@/lib/audit";
import { createOtp, hashOtp, safeEqual } from "@/lib/crypto";
import { sendOtp } from "@/lib/email";
import { createSignerProof } from "@/lib/auth";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request") }),
  z.object({ action: z.literal("verify"), code: z.string().regex(/^\d{6}$/) }),
]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = schema.parse(await request.json());
    const contract = await getContractByToken(token);
    if (contract.status !== "PENDING" || !contract.read_at) throw new Error("Debe leer el documento completo antes de verificar su correo");
    if (contract.otp_blocked) throw new Error("El enlace está bloqueado. Solicite al administrador que lo regenere");
    const supabase = getSupabaseAdmin();
    const now = new Date();

    if (body.action === "request") {
      if (contract.last_otp_sent_at && now.getTime() - new Date(contract.last_otp_sent_at).getTime() < 60_000) throw new Error("Espere 60 segundos antes de solicitar otro código");
      const otp = createOtp();
      const { error } = await supabase.from("contracts").update({ otp_hash: hashOtp(otp, contract.id), otp_expires_at: new Date(now.getTime() + 10 * 60_000).toISOString(), otp_attempts: 0, last_otp_sent_at: now.toISOString(), updated_at: now.toISOString() }).eq("id", contract.id);
      if (error) throw new Error(error.message);
      await sendOtp(contract.signer_email, contract.signer_name, otp);
      await appendEvent({ contractId: contract.id, type: "OTP_SENT", ...requestContext(request) });
      return Response.json({ ok: true });
    }

    if (!contract.otp_hash || !contract.otp_expires_at || new Date(contract.otp_expires_at) < now) throw new Error("El código venció. Solicite uno nuevo");
    const valid = safeEqual(hashOtp(body.code, contract.id), contract.otp_hash);
    if (!valid) {
      const attempts = contract.otp_attempts + 1;
      const blocked = attempts >= 5;
      await supabase.from("contracts").update({ otp_attempts: attempts, otp_blocked: blocked, updated_at: now.toISOString() }).eq("id", contract.id);
      await appendEvent({ contractId: contract.id, type: blocked ? "OTP_BLOCKED" : "OTP_FAILED", metadata: { attempts }, ...requestContext(request) });
      throw new Error(blocked ? "El enlace quedó bloqueado después de cinco intentos" : `Código incorrecto. Quedan ${5 - attempts} intentos`);
    }
    await supabase.from("contracts").update({ verified_at: now.toISOString(), otp_hash: null, otp_expires_at: null, updated_at: now.toISOString() }).eq("id", contract.id);
    await appendEvent({ contractId: contract.id, type: "EMAIL_VERIFIED", ...requestContext(request) });
    return Response.json({ ok: true, proof: await createSignerProof(contract.id, contract.signer_email) });
  } catch (error) { return apiError(error); }
}

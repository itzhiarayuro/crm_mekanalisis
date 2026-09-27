import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, requestContext } from "@/lib/http";
import { getContractByToken } from "@/lib/contracts";
import { verifySignerProof } from "@/lib/auth";
import { downloadBlob, getSupabaseAdmin, uploadBlob } from "@/lib/supabase";
import { appendEvidence } from "@/lib/pdf";
import { sha256 } from "@/lib/crypto";
import { appendEvent } from "@/lib/audit";
import { sendCompletion } from "@/lib/email";

const schema = z.object({
  proof: z.string().min(20),
  signature: z.string().regex(/^data:image\/png;base64,/).max(1_500_000),
  consent: z.literal(true),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = schema.parse(await request.json());
    const contract = await getContractByToken(token);
    if (contract.status !== "PENDING" || !contract.pdf_path || !contract.document_hash || !contract.read_at || !contract.verified_at) throw new Error("El contrato no está listo para firmar");
    if (!(await verifySignerProof(body.proof, contract.id))) throw new Error("La verificación venció. Solicite otro código");
    const context = requestContext(request);
    const signedAt = new Date();
    const originalPdf = await downloadBlob(contract.pdf_path);
    const finalPdf = await appendEvidence(originalPdf, {
      signatureDataUrl: body.signature, signerName: contract.signer_name, signerEmail: contract.signer_email,
      title: contract.title, documentHash: contract.document_hash, publicId: contract.public_id,
      signedAt, ip: context.ip,
    });
    const signedPath = `contracts/${contract.id}/signed.pdf`;
    await uploadBlob(signedPath, finalPdf, "application/pdf");
    const finalHash = sha256(finalPdf);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("contracts").update({
      status: "SIGNED", signed_path: signedPath, final_hash: finalHash, signed_at: signedAt.toISOString(), updated_at: signedAt.toISOString(),
    }).eq("id", contract.id).eq("status", "PENDING").select("id");
    if (error || !data?.length) throw new Error("El contrato ya fue firmado o cambió de estado");
    await appendEvent({ contractId: contract.id, type: "CONSENT_ACCEPTED", metadata: { version: "2026-09-27" }, ...context });
    await appendEvent({ contractId: contract.id, type: "SIGNED", metadata: { documentHash: contract.document_hash, finalHash }, ...context });
    try {
      await Promise.all([
        sendCompletion(contract.signer_email, contract.signer_name, contract.title, contract.public_id),
        process.env.ADMIN_EMAIL ? sendCompletion(process.env.ADMIN_EMAIL, "Administrador", contract.title, contract.public_id) : Promise.resolve(),
      ]);
    } catch { /* Signing remains valid even if notification fails. */ }
    return Response.json({ ok: true, publicId: contract.public_id, finalHash });
  } catch (error) { return apiError(error); }
}

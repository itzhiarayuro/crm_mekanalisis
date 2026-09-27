import { NextRequest } from "next/server";
import { apiError } from "@/lib/http";
import { getContractByToken, maskEmail } from "@/lib/contracts";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const contract = await getContractByToken(token);
    return Response.json({
      title: contract.title,
      signerName: contract.signer_name,
      signerEmail: contract.signer_email,
      signerEmailMasked: maskEmail(contract.signer_email),
      documentHash: contract.document_hash,
      status: contract.status,
      publicId: contract.public_id,
      signedAt: contract.signed_at,
      otpBlocked: contract.otp_blocked,
      expiresAt: contract.expires_at,
      currentDate: new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "America/Bogota" }).format(new Date()),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

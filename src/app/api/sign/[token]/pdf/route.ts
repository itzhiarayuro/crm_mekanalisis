import { NextRequest } from "next/server";
import { apiError, requestContext } from "@/lib/http";
import { getContractByToken } from "@/lib/contracts";
import { downloadBlob } from "@/lib/supabase";
import { appendEvent } from "@/lib/audit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const contract = await getContractByToken(token);
    const path = contract.status === "SIGNED" ? contract.signed_path : contract.pdf_path;
    if (!path) throw new Error("PDF no disponible");
    const bytes = await downloadBlob(path);
    await appendEvent({ contractId: contract.id, type: "PDF_VIEWED", metadata: { version: contract.status === "SIGNED" ? "signed" : "unsigned" }, ...requestContext(request) });
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline", "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return apiError(error); }
}

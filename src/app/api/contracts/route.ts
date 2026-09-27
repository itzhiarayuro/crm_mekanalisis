import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminRequest } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { getSupabaseAdmin, downloadBlob, uploadBlob } from "@/lib/supabase";
import { validateDocx } from "@/lib/docx";
import { convertDocxToPdf } from "@/lib/converter";
import { sha256 } from "@/lib/crypto";
import { appendEvent } from "@/lib/audit";

const schema = z.object({ title: z.string().trim().min(3).max(200), clientId: z.uuid(), uploadPath: z.string().regex(/^uploads\/[a-f0-9-]+\/original\.docx$/) });

export async function GET(request: NextRequest) {
  try {
    await requireAdminRequest(request);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("contracts").select("*, clients(name,email,company)").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return Response.json(data);
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminRequest(request);
    const body = schema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data: client, error: clientError } = await supabase.from("clients").select("*").eq("id", body.clientId).single();
    if (clientError || !client) throw new Error("Cliente no encontrado");
    const { data: contract, error } = await supabase.from("contracts").insert({
      client_id: body.clientId, title: body.title, status: "PROCESSING", signer_name: client.name,
      signer_email: client.email, original_path: body.uploadPath,
    }).select().single();
    if (error) throw new Error(error.message);
    try {
      await appendEvent({ contractId: contract.id, type: "CREATED" });
      const docx = await downloadBlob(body.uploadPath);
      await validateDocx(docx);
      const pdf = await convertDocxToPdf(docx);
      const pdfPath = `contracts/${contract.id}/document.pdf`;
      await uploadBlob(pdfPath, pdf, "application/pdf");
      const documentHash = sha256(pdf);
      const { data: ready, error: updateError } = await supabase.from("contracts").update({ status: "READY", pdf_path: pdfPath, document_hash: documentHash, updated_at: new Date().toISOString() }).eq("id", contract.id).select().single();
      if (updateError) throw new Error(updateError.message);
      await appendEvent({ contractId: contract.id, type: "CONVERTED", metadata: { documentHash } });
      return Response.json(ready, { status: 201 });
    } catch (conversionError) {
      const reason = conversionError instanceof Error ? conversionError.message.slice(0, 500) : "Error de conversión";
      await supabase.from("contracts").update({ status: "FAILED", failure_reason: reason, updated_at: new Date().toISOString() }).eq("id", contract.id);
      await appendEvent({ contractId: contract.id, type: "CONVERSION_FAILED", metadata: { reason } });
      throw conversionError;
    }
  } catch (error) { return apiError(error); }
}

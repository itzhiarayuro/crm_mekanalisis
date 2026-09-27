import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminRequest } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { getSupabaseAdmin, downloadBlob, uploadBlob } from "@/lib/supabase";
import { validateDocx } from "@/lib/docx";
import { convertDocxToPdf } from "@/lib/converter";
import { sha256 } from "@/lib/crypto";
import { appendEvent } from "@/lib/audit";

const schema = z.object({ title: z.string().trim().min(3).max(200), clientId: z.uuid(), quoteId: z.uuid().optional().nullable(), isTest: z.boolean().optional(), uploadPath: z.string().regex(/^uploads\/[a-f0-9-]+\/original\.docx$/) });

type ContractClientRelation = {
  nombre: string;
  email: string | null;
  empresa: string | null;
};

function normalizeClientRelation(row: { clients: ContractClientRelation | null; [key: string]: unknown }) {
  return {
    ...row,
    clients: row.clients ? { name: row.clients.nombre, email: row.clients.email, company: row.clients.empresa } : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminRequest(request);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("contracts").select("*, clients:clientes(nombre,email,empresa), quote:cotizaciones(id,numero,proyecto)").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return Response.json((data || []).map(normalizeClientRelation));
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminRequest(request);
    const body = schema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data: client, error: clientError } = await supabase.from("clientes").select("*").eq("id", body.clientId).single();
    if (clientError || !client) throw new Error("Cliente no encontrado");
    if (body.quoteId) {
      const { data: quote, error: quoteError } = await supabase.from("cotizaciones").select("id").eq("id", body.quoteId).eq("cliente_id", body.clientId).maybeSingle();
      if (quoteError || !quote) throw new Error("La cotización no pertenece al cliente seleccionado");
    }
    const { data: contract, error } = await supabase.from("contracts").insert({
      client_id: body.clientId, cotizacion_id: body.quoteId || null, title: body.title, status: "PROCESSING", is_test: body.isTest === true, signer_name: client.nombre,
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

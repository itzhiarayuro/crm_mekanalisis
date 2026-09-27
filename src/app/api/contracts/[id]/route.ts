import { NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { getSupabaseAdmin, removeBlobs } from "@/lib/supabase";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRequest(request);
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const [{ data: contract, error }, { data: events }] = await Promise.all([
      supabase.from("contracts").select("*, clients:clientes(id,nombre,empresa,email), quote:cotizaciones(id,numero,proyecto)").eq("id", id).single(),
      supabase.from("contract_events").select("*").eq("contract_id", id).order("id"),
    ]);
    if (error || !contract) throw new Error("Contrato no encontrado");
    return Response.json({ ...contract, clients: contract.clients ? { name: contract.clients.nombre, company: contract.clients.empresa, email: contract.clients.email } : null, events: events || [] });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRequest(request);
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("contracts").select("status,is_test,original_path,pdf_path,signed_path").eq("id", id).single();
    if (!data || (!data.is_test && !["DRAFT", "FAILED"].includes(data.status))) throw new Error("Solo se pueden borrar contratos de prueba o conversiones fallidas");
    await removeBlobs([data.original_path, data.pdf_path, data.signed_path]);
    const { error } = await supabase.from("contracts").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}

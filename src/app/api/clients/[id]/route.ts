import { NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase";
import { toClient, toClientUpdate } from "@/lib/client-record";
import { clientInputSchema } from "@/lib/client-input";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRequest(request);
    const { id } = await params;
    const input = clientInputSchema.parse(await request.json());
    const { data, error } = await getSupabaseAdmin().from("clientes").update({ ...toClientUpdate(input), updated_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return Response.json(toClient(data));
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRequest(request);
    const { id } = await params;
    const { count } = await getSupabaseAdmin().from("contracts").select("id", { count: "exact", head: true }).eq("client_id", id);
    if (count) throw new Error("No se puede borrar un cliente con contratos");
    const { error } = await getSupabaseAdmin().from("clientes").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}

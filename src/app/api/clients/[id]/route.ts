import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminRequest } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase";
import { toClient, toClientUpdate } from "@/lib/client-record";

const schema = z.object({
  name: z.string().trim().min(2).max(150), email: z.string().trim().email().or(z.literal("")).optional().nullable(), company: z.string().max(150).nullable().optional(),
  phone: z.string().max(50).nullable().optional(), type: z.string().max(80).nullable().optional(), source: z.string().max(120).nullable().optional(), status: z.string().max(80).nullable().optional(), notes: z.string().max(2000).nullable().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRequest(request);
    const { id } = await params;
    const input = schema.parse(await request.json());
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

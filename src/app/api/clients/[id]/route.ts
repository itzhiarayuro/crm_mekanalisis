import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminRequest } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  name: z.string().trim().min(2).max(150), email: z.email(), company: z.string().max(150).nullable().optional(),
  phone: z.string().max(50).nullable().optional(), notes: z.string().max(2000).nullable().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRequest(request);
    const { id } = await params;
    const { data, error } = await getSupabaseAdmin().from("clients").update({ ...schema.parse(await request.json()), updated_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return Response.json(data);
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRequest(request);
    const { id } = await params;
    const { count } = await getSupabaseAdmin().from("contracts").select("id", { count: "exact", head: true }).eq("client_id", id);
    if (count) throw new Error("No se puede borrar un cliente con contratos");
    const { error } = await getSupabaseAdmin().from("clients").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}

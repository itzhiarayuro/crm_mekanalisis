import { NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase";
import { toClient, toClientInsert } from "@/lib/client-record";
import { clientInputSchema } from "@/lib/client-input";

export async function GET(request: NextRequest) {
  try {
    await requireAdminRequest(request);
    const { data, error } = await getSupabaseAdmin().from("clientes").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return Response.json((data || []).map(toClient));
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminRequest(request);
    const body = clientInputSchema.parse(await request.json());
    const { data, error } = await getSupabaseAdmin().from("clientes").insert(toClientInsert(body)).select().single();
    if (error) throw new Error(error.message);
    return Response.json(toClient(data), { status: 201 });
  } catch (error) { return apiError(error); }
}

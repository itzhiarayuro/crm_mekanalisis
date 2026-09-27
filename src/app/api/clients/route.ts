import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminRequest } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase";
import { toClient, toClientInsert } from "@/lib/client-record";

const schema = z.object({
  name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().or(z.literal("")).optional().nullable(),
  company: z.string().trim().max(150).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  type: z.string().trim().max(80).optional().nullable(),
  source: z.string().trim().max(120).optional().nullable(),
  status: z.string().trim().max(80).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

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
    const body = schema.parse(await request.json());
    const { data, error } = await getSupabaseAdmin().from("clientes").insert(toClientInsert(body)).select().single();
    if (error) throw new Error(error.message);
    return Response.json(toClient(data), { status: 201 });
  } catch (error) { return apiError(error); }
}

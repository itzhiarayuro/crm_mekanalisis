import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminRequest } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase";

const query = z.object({ clientId: z.uuid() });

export async function GET(request: NextRequest) {
  try {
    await requireAdminRequest(request);
    const { clientId } = query.parse({ clientId: request.nextUrl.searchParams.get("clientId") });
    const { data, error } = await getSupabaseAdmin()
      .from("cotizaciones")
      .select("id,numero,proyecto,fecha_emision,estado")
      .eq("cliente_id", clientId)
      .order("fecha_emision", { ascending: false });
    if (error) throw new Error(error.message);
    return Response.json(data || []);
  } catch (error) {
    return apiError(error);
  }
}

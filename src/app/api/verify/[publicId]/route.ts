import { NextRequest } from "next/server";
import { apiError } from "@/lib/http";
import { maskEmail } from "@/lib/contracts";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const { publicId } = await params;
    const { data, error } = await getSupabaseAdmin().from("contracts").select("title,status,signer_email,signed_at,document_hash,final_hash,public_id").eq("public_id", publicId).single();
    if (error || !data) throw new Error("Certificado no encontrado");
    return Response.json({ ...data, signer_email: maskEmail(data.signer_email) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

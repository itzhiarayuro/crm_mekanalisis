import { NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { downloadBlob, getSupabaseAdmin } from "@/lib/supabase";
import { appendEvent } from "@/lib/audit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRequest(request);
    const { id } = await params;
    const kind = request.nextUrl.searchParams.get("kind") || "pdf";
    const { data, error } = await getSupabaseAdmin().from("contracts").select("*").eq("id", id).single();
    if (error || !data) throw new Error("Contrato no encontrado");
    const path = kind === "original" ? data.original_path : kind === "signed" ? data.signed_path : data.pdf_path;
    if (!path) throw new Error("Archivo no disponible");
    const bytes = await downloadBlob(path);
    await appendEvent({ contractId: id, type: "DOWNLOADED", metadata: { kind, actor: "admin" } });
    const ext = kind === "original" ? "docx" : "pdf";
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": ext === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename="contrato-${id}.${ext}"`, "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

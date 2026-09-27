import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireAdminRequest } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase";
import { STORAGE_BUCKET } from "@/lib/config";

const schema = z.object({ filename: z.string().max(200), size: z.number().int().positive().max(20 * 1024 * 1024) });

export async function POST(request: NextRequest) {
  try {
    await requireAdminRequest(request);
    const body = schema.parse(await request.json());
    if (!body.filename.toLowerCase().endsWith(".docx")) throw new Error("Solo se permiten archivos .docx");
    const path = `uploads/${randomUUID()}/original.docx`;
    const { data, error } = await getSupabaseAdmin().storage.from(STORAGE_BUCKET).createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return Response.json({ path, token: data.token });
  } catch (error) { return apiError(error); }
}

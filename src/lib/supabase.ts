import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requiredEnv, STORAGE_BUCKET } from "./config";

let adminClient: SupabaseClient | undefined;

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(
      requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return adminClient;
}

export async function downloadBlob(path: string): Promise<Buffer> {
  const { data, error } = await getSupabaseAdmin().storage.from(STORAGE_BUCKET).download(path);
  if (error || !data) throw new Error(error?.message || "No fue posible descargar el archivo");
  return Buffer.from(await data.arrayBuffer());
}

export async function uploadBlob(path: string, bytes: Buffer, contentType: string): Promise<void> {
  const { error } = await getSupabaseAdmin().storage.from(STORAGE_BUCKET).upload(path, bytes, {
    contentType,
    upsert: true,
    cacheControl: "0",
  });
  if (error) throw new Error(error.message);
}

export async function removeBlobs(paths: Array<string | null | undefined>): Promise<void> {
  const existing = paths.filter((path): path is string => Boolean(path));
  if (!existing.length) return;
  const { error } = await getSupabaseAdmin().storage.from(STORAGE_BUCKET).remove(existing);
  if (error) throw new Error(error.message);
}

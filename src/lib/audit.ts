import { getSupabaseAdmin } from "./supabase";
import { hmac } from "./crypto";

interface EventInput {
  contractId: string;
  type: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}

export async function appendEvent(input: EventInput): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: last } = await supabase
    .from("contract_events")
    .select("hash")
    .eq("contract_id", input.contractId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  const createdAt = new Date().toISOString();
  const prevHash = (last?.hash as string | undefined) || null;
  const metadata = input.metadata || {};
  const canonical = JSON.stringify({
    contractId: input.contractId,
    type: input.type,
    metadata,
    ip: input.ip || null,
    userAgent: input.userAgent || null,
    prevHash,
    createdAt,
  });
  const hash = hmac(canonical);
  const { error } = await supabase.from("contract_events").insert({
    contract_id: input.contractId,
    type: input.type,
    metadata,
    ip: input.ip || null,
    user_agent: input.userAgent || null,
    prev_hash: prevHash,
    hash,
    created_at: createdAt,
  });
  if (error) throw new Error(error.message);
}

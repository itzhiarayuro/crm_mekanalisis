import type { Contract } from "./types";
import { sha256 } from "./crypto";
import { getSupabaseAdmin } from "./supabase";

export async function getContractByToken(token: string): Promise<Contract> {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("Enlace inválido");
  const { data, error } = await getSupabaseAdmin()
    .from("contracts")
    .select("*")
    .eq("token_hash", sha256(token))
    .maybeSingle();
  if (error || !data) throw new Error("Contrato no encontrado");
  const contract = data as Contract;
  if (contract.status === "REVOKED") throw new Error("Este enlace fue revocado");
  if (contract.status === "EXPIRED" || (contract.expires_at && new Date(contract.expires_at) < new Date())) {
    if (contract.status === "PENDING") {
      await getSupabaseAdmin().from("contracts").update({ status: "EXPIRED", updated_at: new Date().toISOString() }).eq("id", contract.id);
    }
    throw new Error("Este enlace venció");
  }
  return contract;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 2)}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
}

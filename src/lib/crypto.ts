import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(): string {
  return randomBytes(32).toString("hex");
}

export function createOtp(): string {
  const value = randomBytes(4).readUInt32BE(0) % 1_000_000;
  return value.toString().padStart(6, "0");
}

export function hashOtp(otp: string, contractId: string): string {
  const secret = process.env.AUDIT_HMAC_KEY || process.env.SESSION_SECRET || "development-only";
  return createHmac("sha256", secret).update(`${contractId}:${otp}`).digest("hex");
}

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function hmac(value: string): string {
  const secret = process.env.AUDIT_HMAC_KEY;
  if (!secret) throw new Error("Falta AUDIT_HMAC_KEY");
  return createHmac("sha256", secret).update(value).digest("hex");
}

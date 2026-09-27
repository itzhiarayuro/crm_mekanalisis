import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { AdminSession } from "./types";
import { requiredEnv } from "./config";

const COOKIE = "crm_session";
const key = () => new TextEncoder().encode(requiredEnv("SESSION_SECRET"));

export async function authenticateAdmin(email: string, password: string): Promise<boolean> {
  const expectedEmail = requiredEnv("ADMIN_EMAIL").toLowerCase();
  const hash = requiredEnv("ADMIN_PASSWORD_HASH");
  return email.toLowerCase() === expectedEmail && bcrypt.compare(password, hash);
}

export async function createAdminToken(email: string): Promise<string> {
  return new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(key());
}

export async function setAdminCookie(token: string): Promise<void> {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminCookie(): Promise<void> {
  (await cookies()).set(COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
}

async function verifyToken(token?: string): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if (payload.role !== "admin" || typeof payload.email !== "string") return null;
    return { email: payload.email, role: "admin" };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  return verifyToken((await cookies()).get(COOKIE)?.value);
}

export async function requireAdminRequest(request: NextRequest): Promise<AdminSession> {
  const session = await verifyToken(request.cookies.get(COOKIE)?.value);
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function createSignerProof(contractId: string, email: string): Promise<string> {
  return new SignJWT({ contractId, email, purpose: "sign" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(key());
}

export async function verifySignerProof(proof: string, contractId: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(proof, key());
    return payload.purpose === "sign" && payload.contractId === contractId;
  } catch {
    return false;
  }
}

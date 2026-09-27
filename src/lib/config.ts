export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "contracts";
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
export const BOGOTA_TIME_ZONE = "America/Bogota";

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

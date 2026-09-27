import { z } from "zod";

// These values are defined by the existing Bd_clientes constraint.
export const CLIENT_STATUS_OPTIONS = [
  ["prospecto", "Prospecto"],
  ["tibia", "Oportunidad tibia"],
  ["caliente", "Oportunidad caliente"],
  ["cliente_activo", "Cliente activo"],
  ["cliente_inactivo", "Cliente inactivo"],
] as const;

export const clientStatusSchema = z.enum(CLIENT_STATUS_OPTIONS.map(([value]) => value));

export const clientInputSchema = z.object({
  name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().or(z.literal("")).optional().nullable(),
  company: z.string().trim().max(150).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  type: z.string().trim().max(80).optional().nullable(),
  source: z.string().trim().max(120).optional().nullable(),
  status: clientStatusSchema.optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

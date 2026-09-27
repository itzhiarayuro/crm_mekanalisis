import type { Client } from "./types";

type ClientRow = {
  id: string;
  nombre: string;
  empresa: string | null;
  email: string | null;
  whatsapp: string | null;
  tipo: string | null;
  canal_origen: string | null;
  estado: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

export function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.nombre,
    company: row.empresa,
    email: row.email,
    phone: row.whatsapp,
    type: row.tipo,
    source: row.canal_origen,
    status: row.estado,
    notes: row.notas,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

type ClientInput = {
  name: string;
  email?: string | null;
  company?: string | null;
  phone?: string | null;
  type?: string | null;
  source?: string | null;
  status?: string | null;
  notes?: string | null;
};

export function toClientInsert(input: ClientInput) {
  return {
    nombre: input.name,
    empresa: emptyToNull(input.company),
    email: emptyToNull(input.email),
    whatsapp: emptyToNull(input.phone),
    tipo: emptyToNull(input.type) || "persona_natural",
    canal_origen: emptyToNull(input.source),
    estado: emptyToNull(input.status) || "prospecto",
    notas: emptyToNull(input.notes),
  };
}

export function toClientUpdate(input: ClientInput) {
  const values: Record<string, string | null> = { nombre: input.name };
  if (input.company !== undefined) values.empresa = emptyToNull(input.company);
  if (input.email !== undefined) values.email = emptyToNull(input.email);
  if (input.phone !== undefined) values.whatsapp = emptyToNull(input.phone);
  if (input.type !== undefined) values.tipo = emptyToNull(input.type);
  if (input.source !== undefined) values.canal_origen = emptyToNull(input.source);
  if (input.status !== undefined) values.estado = emptyToNull(input.status);
  if (input.notes !== undefined) values.notas = emptyToNull(input.notes);
  return values;
}

function emptyToNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

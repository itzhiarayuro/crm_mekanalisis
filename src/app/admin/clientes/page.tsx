"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Client } from "@/lib/types";
import { CLIENT_STATUS_OPTIONS } from "@/lib/client-input";
import { Pencil, Plus, Trash2, X } from "lucide-react";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [editing, setEditing] = useState<Client | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/clients");
    if (response.ok) setClients(await response.json());
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    fetch("/api/clients")
      .then(async (response) => { if (active && response.ok) setClients(await response.json()); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form);
    const existing = editing || null;
    const response = await fetch(existing ? `/api/clients/${existing.id}` : "/api/clients", {
      method: existing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok) { setError(body.error || "No se pudo guardar el cliente"); return; }
    setEditing(undefined); await load();
  }

  async function remove(client: Client) {
    if (!window.confirm(`¿Eliminar a ${client.name}? Esta acción no se puede deshacer.`)) return;
    const response = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    const body = await response.json();
    if (!response.ok) { setError(body.error || "No se pudo eliminar el cliente"); return; }
    await load();
  }

  return <>
    <div className="flex justify-between items-start gap-4 mb-7"><div><h1 className="text-3xl font-extrabold">Clientes</h1><p className="muted mt-1">Fuente única de clientes y destinatarios de contratos.</p></div><button className="btn btn-primary" onClick={() => setEditing(null)}><Plus size={18} />Nuevo cliente</button></div>
    {error && <p className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</p>}
    <section className="card overflow-hidden">
      {loading ? <p className="p-8 muted">Cargando…</p> : clients.length === 0 ? <p className="p-8 muted text-center">Cree su primer cliente.</p> : <div className="divide-y divide-slate-100">{clients.map((client) => <div className="p-4 grid md:grid-cols-[1.3fr_1fr_1fr_auto] gap-3 items-center" key={client.id}><div><p className="font-bold">{client.name}</p><p className="muted text-sm">{client.company || "Sin empresa"} · {client.status || "sin estado"}</p></div><p className="text-sm">{client.email || "Sin correo"}</p><p className="text-sm muted">{client.phone || "—"}<br />{client.source || "Sin canal"}</p><div className="flex gap-2"><button className="btn btn-secondary !p-2" title="Editar" onClick={() => setEditing(client)}><Pencil size={16} /></button><button className="btn btn-secondary !p-2 text-red-700" title="Eliminar" onClick={() => void remove(client)}><Trash2 size={16} /></button></div></div>)}</div>}
    </section>
    {editing !== undefined && <ClientDialog client={editing} error={error} onClose={() => { setEditing(undefined); setError(""); }} onSubmit={submit} />}
  </>;
}

function ClientDialog({ client, error, onClose, onSubmit }: { client: Client | null; error: string; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> }) {
  return <div className="fixed inset-0 bg-slate-950/35 grid place-items-center p-4 z-50"><form className="card p-6 w-full max-w-lg space-y-4" onSubmit={(event) => void onSubmit(event)} key={client?.id || "new"}><div className="flex justify-between"><h2 className="text-xl font-extrabold">{client ? "Editar cliente" : "Nuevo cliente"}</h2><button type="button" onClick={onClose}><X /></button></div><Field name="name" label="Nombre completo" required value={client?.name} /><Field name="email" label="Correo" type="email" value={client?.email || ""} /><Field name="company" label="Empresa" value={client?.company || ""} /><Field name="phone" label="WhatsApp o teléfono" value={client?.phone || ""} /><Select name="type" label="Tipo" value={client?.type || "persona_natural"} options={[["persona_natural", "Persona natural"], ["empresa", "Empresa"]]} /><Select name="status" label="Estado" value={client?.status || "prospecto"} options={[...CLIENT_STATUS_OPTIONS]} /><Field name="source" label="Canal de origen" value={client?.source || ""} /><label><span className="label">Notas</span><textarea className="input" name="notes" rows={3} defaultValue={client?.notes || ""} /></label>{error && <p className="text-red-700 text-sm">{error}</p>}<button className="btn btn-primary w-full">Guardar cliente</button></form></div>;
}

function Field({ name, label, type = "text", required = false, value = "" }: { name: string; label: string; type?: string; required?: boolean; value?: string }) { return <label><span className="label">{label}</span><input className="input" name={name} type={type} required={required} defaultValue={value} /></label>; }
function Select({ name, label, value, options }: { name: string; label: string; value: string; options: ReadonlyArray<readonly [string, string]> }) { return <label><span className="label">{label}</span><select className="input" name={name} defaultValue={value}>{options.map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}</select></label>; }

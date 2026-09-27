"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import type { Client } from "@/lib/types";

type Quote = { id: string; numero: string | null; proyecto: string; fecha_emision: string; estado: string | null };

export default function NewContract() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clientId, setClientId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch("/api/clients").then((r) => r.json()).then(setClients); }, []);
  useEffect(() => {
    if (!clientId) return;
    fetch(`/api/quotes?clientId=${clientId}`).then((r) => r.ok ? r.json() : []).then(setQuotes);
  }, [clientId]);

  function selectClient(id: string) {
    setClientId(id);
    setQuotes([]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const form = new FormData(event.currentTarget);
      const file = form.get("file") as File;
      if (!file?.name.toLowerCase().endsWith(".docx")) throw new Error("Seleccione un archivo .docx");
      const uploadResponse = await fetch("/api/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, size: file.size }) });
      const upload = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(upload.error);
      const storage = createClient(upload.supabaseUrl, upload.anonKey);
      const { error: uploadError } = await storage.storage.from("contracts").uploadToSignedUrl(upload.path, upload.token, file, { contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      if (uploadError) throw uploadError;
      const response = await fetch("/api/contracts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.get("title"), clientId, quoteId: form.get("quoteId") || null, isTest: form.get("isTest") === "on", uploadPath: upload.path }) });
      const contract = await response.json();
      if (!response.ok) throw new Error(contract.error);
      router.push(`/admin/contratos/${contract.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear el contrato");
      setLoading(false);
    }
  }

  return <>
    <div className="mb-7"><h1 className="text-3xl font-extrabold">Nuevo contrato</h1><p className="muted mt-1">Cargue el Word, compruebe la conversión y envíelo.</p></div>
    <form onSubmit={submit} className="card p-6 max-w-2xl space-y-5">
      <label><span className="label">Título del contrato</span><input name="title" className="input" required minLength={3} placeholder="Contrato de prestación de servicios" /></label>
      <label><span className="label">Cliente y firmante</span><select name="clientId" className="input" required value={clientId} onChange={(event) => selectClient(event.target.value)}><option value="" disabled>Seleccione un cliente</option>{clients.map((client) => <option value={client.id} key={client.id}>{client.name} · {client.email || "sin correo"}</option>)}</select></label>
      <label><span className="label">Cotización relacionada <em className="muted font-normal">(opcional)</em></span><select name="quoteId" className="input" disabled={!clientId}><option value="">Sin cotización</option>{quotes.map((quote) => <option value={quote.id} key={quote.id}>{quote.numero || "Sin número"} · {quote.proyecto}</option>)}</select></label>
      <label><span className="label">Documento Word</span><input name="file" className="input" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required /><span className="muted text-xs mt-2 block">DOCX sin macros, máximo 20 MB. La conversión puede tardar unos segundos.</span></label>
      <label className="flex gap-3 items-start rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"><input name="isTest" type="checkbox" className="mt-1" /><span><strong>Contrato de prueba</strong><br /><span className="muted">Usa el flujo completo de firma, pero podrá eliminarse incluso después de firmado. No lo use para documentos reales.</span></span></label>
      {error && <p className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</p>}
      <button className="btn btn-primary w-full" disabled={loading}>{loading && <span className="spinner" />}{loading ? "Validando y convirtiendo…" : "Crear y convertir contrato"}</button>
    </form>
  </>;
}

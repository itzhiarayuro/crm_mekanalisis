import Link from "next/link";
import { FileCheck2, Files, Send, Users } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";
export default async function Dashboard(){
  const supabase=getSupabaseAdmin();
  const [{data:contracts},{count:clients}]=await Promise.all([supabase.from('contracts').select('id,title,status,signer_name,created_at').order('created_at',{ascending:false}).limit(6),supabase.from('clients').select('id',{count:'exact',head:true})]);
  const rows=contracts||[]; const all=await supabase.from('contracts').select('status'); const stats=all.data||[];
  return <><div className="flex justify-between items-start gap-4 mb-7"><div><h1 className="text-3xl font-extrabold">Resumen</h1><p className="muted mt-1">Contratos, clientes y actividad reciente.</p></div><Link className="btn btn-primary" href="/admin/contratos/nuevo">Nuevo contrato</Link></div>
  <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8"><Stat icon={<Files/>} label="Contratos" value={stats.length}/><Stat icon={<Send/>} label="Pendientes" value={stats.filter(x=>x.status==='PENDING').length}/><Stat icon={<FileCheck2/>} label="Firmados" value={stats.filter(x=>x.status==='SIGNED').length}/><Stat icon={<Users/>} label="Clientes" value={clients||0}/></div>
  <section className="card overflow-hidden"><div className="p-5 border-b border-slate-200 flex justify-between"><h2 className="font-extrabold">Contratos recientes</h2><Link className="text-teal-700 font-bold text-sm" href="/admin/contratos">Ver todos</Link></div>{rows.length===0?<p className="p-8 muted text-center">Todavía no hay contratos.</p>:<div className="divide-y divide-slate-100">{rows.map(row=><Link key={row.id} href={`/admin/contratos/${row.id}`} className="p-4 flex items-center justify-between hover:bg-slate-50"><div><p className="font-bold">{row.title}</p><p className="muted text-sm">{row.signer_name}</p></div><StatusBadge status={row.status}/></Link>)}</div>}</section></>
}
function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:number}){return <div className="card p-5 flex items-center gap-4"><span className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 grid place-items-center">{icon}</span><div><p className="text-2xl font-extrabold">{value}</p><p className="muted text-sm">{label}</p></div></div>}

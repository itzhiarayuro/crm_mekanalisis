import Link from "next/link";
import { redirect } from "next/navigation";
import { FileSignature, LayoutDashboard, Users, Files } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
export const dynamic = "force-dynamic";
export default async function AdminLayout({children}:{children:React.ReactNode}){ if(!(await getAdminSession())) redirect('/login'); return <div className="min-h-screen"><header className="bg-white border-b border-slate-200 sticky top-0 z-30"><div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between"><Link href="/admin" className="flex items-center gap-2 font-extrabold"><span className="w-9 h-9 rounded-lg bg-teal-700 text-white grid place-items-center"><FileSignature size={20}/></span>Mekanálisis</Link><LogoutButton/></div></header><div className="max-w-7xl mx-auto grid md:grid-cols-[210px_1fr] gap-7 px-4 py-7"><nav className="card h-fit p-3 flex md:flex-col gap-1 overflow-auto"><Nav href="/admin" icon={<LayoutDashboard size={18}/>} label="Resumen"/><Nav href="/admin/clientes" icon={<Users size={18}/>} label="Clientes"/><Nav href="/admin/contratos" icon={<Files size={18}/>} label="Contratos"/></nav><main className="min-w-0">{children}</main></div></div> }
function Nav({href,icon,label}:{href:string;icon:React.ReactNode;label:string}){return <Link href={href} className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-teal-50 font-semibold text-sm whitespace-nowrap">{icon}{label}</Link>}

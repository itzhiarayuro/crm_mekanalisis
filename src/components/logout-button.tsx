"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
export function LogoutButton(){const router=useRouter();return <button className="btn btn-secondary text-sm" onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});router.push('/login');router.refresh();}}><LogOut size={16}/>Salir</button>}

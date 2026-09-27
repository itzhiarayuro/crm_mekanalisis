import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Mekanálisis CRM", description: "Contratos y firma electrónica" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html>; }

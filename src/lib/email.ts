import nodemailer from "nodemailer";
import { APP_URL, requiredEnv } from "./config";

function transport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: requiredEnv("SMTP_USER"),
      pass: requiredEnv("SMTP_APP_PASSWORD"),
    },
  });
}

const from = () => process.env.EMAIL_FROM || requiredEnv("SMTP_USER");

export async function sendInvitation(to: string, name: string, title: string, token: string) {
  const url = `${APP_URL}/sign/${token}`;
  return transport().sendMail({
    from: `Mekanálisis Contratos <${from()}>`,
    to,
    subject: `Firma requerida: ${title}`,
    text: `Hola ${name},\n\nMekanálisis te invita a revisar y firmar electrónicamente el contrato “${title}”.\n\n${url}\n\nEl enlace es personal. No lo reenvíes.`,
    html: `<p>Hola ${escapeHtml(name)},</p><p>Mekanálisis te invita a revisar y firmar electrónicamente el contrato <strong>${escapeHtml(title)}</strong>.</p><p><a href="${url}">Revisar y firmar contrato</a></p><p>El enlace es personal. No lo reenvíes.</p>`,
  });
}

export async function sendOtp(to: string, name: string, otp: string) {
  return transport().sendMail({
    from: `Mekanálisis Contratos <${from()}>`,
    to,
    subject: `${otp} es tu código para firmar`,
    text: `Hola ${name}. Tu código de verificación es ${otp}. Vence en 10 minutos.`,
    html: `<p>Hola ${escapeHtml(name)}.</p><p>Tu código para completar la firma es:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${otp}</p><p>Vence en 10 minutos.</p>`,
  });
}

export async function sendCompletion(to: string, name: string, title: string, publicId: string) {
  const url = `${APP_URL}/verify/${publicId}`;
  return transport().sendMail({
    from: `Mekanálisis Contratos <${from()}>`,
    to,
    subject: `Contrato firmado: ${title}`,
    text: `Hola ${name}. El contrato “${title}” fue firmado correctamente. Verificación: ${url}`,
    html: `<p>Hola ${escapeHtml(name)}.</p><p>El contrato <strong>${escapeHtml(title)}</strong> fue firmado correctamente.</p><p><a href="${url}">Verificar documento</a></p>`,
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!);
}

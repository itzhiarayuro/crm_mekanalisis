import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { BOGOTA_TIME_ZONE } from "./config";

interface Evidence {
  signatureDataUrl: string;
  signerName: string;
  signerEmail: string;
  title: string;
  documentHash: string;
  publicId: string;
  signedAt: Date;
  ip: string | null;
}

export async function appendEvidence(pdfBytes: Buffer, evidence: Evidence): Promise<Buffer> {
  const pdf = await PDFDocument.load(pdfBytes);
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const date = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: BOGOTA_TIME_ZONE,
  }).format(evidence.signedAt);

  page.drawText("CERTIFICADO DE FIRMA ELECTRÓNICA", { x: 55, y: 770, size: 18, font: bold, color: rgb(0.05, 0.18, 0.24) });
  page.drawText(evidence.title.slice(0, 80), { x: 55, y: 735, size: 12, font: bold });
  drawLine(page, regular, "Firmante", evidence.signerName, 690);
  drawLine(page, regular, "Correo verificado", evidence.signerEmail, 665);
  drawLine(page, regular, "Fecha y hora", date, 640);
  drawLine(page, regular, "Dirección IP", evidence.ip || "No disponible", 615);

  const pngData = evidence.signatureDataUrl.replace(/^data:image\/png;base64,/, "");
  const signature = await pdf.embedPng(Buffer.from(pngData, "base64"));
  const scale = Math.min(260 / signature.width, 120 / signature.height, 1);
  page.drawText("Firma capturada:", { x: 55, y: 570, size: 11, font: bold });
  page.drawRectangle({ x: 55, y: 410, width: 300, height: 140, borderColor: rgb(0.75, 0.78, 0.8), borderWidth: 1 });
  page.drawImage(signature, { x: 70, y: 425, width: signature.width * scale, height: signature.height * scale });

  page.drawText("Evidencia de integridad", { x: 55, y: 370, size: 12, font: bold });
  page.drawText("SHA-256 del PDF revisado:", { x: 55, y: 345, size: 9, font: regular });
  page.drawText(evidence.documentHash, { x: 55, y: 328, size: 8, font: regular });
  page.drawText(`ID público: ${evidence.publicId}`, { x: 55, y: 300, size: 9, font: regular });
  page.drawText("El firmante declaró haber leído el documento completo, aceptó usar firma electrónica", { x: 55, y: 250, size: 9, font: regular });
  page.drawText("y verificó el control de su correo mediante un código de un solo uso.", { x: 55, y: 234, size: 9, font: regular });
  page.drawText("Este certificado constituye evidencia electrónica; no es una firma digital certificada.", { x: 55, y: 190, size: 8, font: regular, color: rgb(0.35, 0.35, 0.35) });
  return Buffer.from(await pdf.save());
}

function drawLine(page: ReturnType<PDFDocument["addPage"]>, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, label: string, value: string, y: number) {
  page.drawText(`${label}:`, { x: 55, y, size: 10, font });
  page.drawText(value.slice(0, 90), { x: 160, y, size: 10, font });
}

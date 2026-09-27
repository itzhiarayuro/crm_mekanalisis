import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

export async function convertDocxToPdf(docx: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "crm-docx-"));
  const input = path.join(dir, "contrato.docx");
  try {
    await writeFile(input, docx);
    await run(
      process.env.SOFFICE_PATH || "soffice",
      ["--headless", "--safe-mode", "--convert-to", "pdf", "--outdir", dir, input],
      Number(process.env.CONVERSION_TIMEOUT_MS || 120_000),
    );
    return await readFile(path.join(dir, "contrato.pdf"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No fue posible convertir el Word a PDF: ${message}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function run(command: string, args: string[], timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], shell: false });
    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += String(chunk).slice(0, 2000)));
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("La conversión excedió el tiempo máximo"));
    }, timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(stderr || `LibreOffice terminó con código ${code}`));
    });
  });
}

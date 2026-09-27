import JSZip from "jszip";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024;

export async function validateDocx(bytes: Buffer): Promise<void> {
  if (bytes.length === 0 || bytes.length > MAX_FILE_BYTES) {
    throw new Error("El DOCX debe pesar entre 1 byte y 20 MB");
  }
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error("El archivo no es un DOCX válido");

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
  } catch {
    throw new Error("El DOCX está corrupto o no se puede leer");
  }
  if (!zip.file("[Content_Types].xml") || !zip.file("word/document.xml")) {
    throw new Error("La estructura interna no corresponde a un documento Word");
  }
  const names = Object.keys(zip.files).map((name) => name.toLowerCase());
  if (names.some((name) => name.includes("vbaproject") || name.endsWith(".bin"))) {
    throw new Error("No se aceptan documentos con macros o contenido ejecutable");
  }
  let total = 0;
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const content = await entry.async("uint8array");
    total += content.byteLength;
    if (total > MAX_UNCOMPRESSED_BYTES) throw new Error("El DOCX excede el tamaño interno permitido");
  }
}

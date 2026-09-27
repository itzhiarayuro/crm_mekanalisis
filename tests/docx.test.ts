import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import { validateDocx } from "../src/lib/docx";

async function docx(extra?: Record<string, string>) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", "<Types/>");
  zip.file("word/document.xml", "<document/>");
  for (const [name, value] of Object.entries(extra || {})) zip.file(name, value);
  return Buffer.from(await zip.generateAsync({ type: "uint8array" }));
}

test("acepta una estructura DOCX mínima", async () => assert.doesNotReject(validateDocx(await docx())));
test("rechaza macros aunque el archivo se llame DOCX", async () => assert.rejects(validateDocx(await docx({ "word/vbaProject.bin": "macro" })), /macros/));
test("rechaza bytes que no sean ZIP/DOCX", async () => assert.rejects(validateDocx(Buffer.from("not-a-docx")), /DOCX válido/));

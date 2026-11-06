import path from "path";

export type FileCheck = { ok: true } | { ok: false; reason: string };

const startsWith = (buffer: Buffer, bytes: number[]) => bytes.every((byte, index) => buffer[index] === byte);

function checkPdf(buffer: Buffer): FileCheck {
  const head = buffer.subarray(0, 1024).toString("latin1");
  if (!head.includes("%PDF-")) return { ok: false, reason: "Not a PDF file (missing the PDF header)." };
  const tail = buffer.subarray(Math.max(0, buffer.length - 2048)).toString("latin1");
  if (!tail.includes("%%EOF")) return { ok: false, reason: "The PDF is incomplete (no end-of-file marker)." };
  if (!tail.includes("startxref")) return { ok: false, reason: "The PDF is damaged (no cross-reference table)." };
  // Every real PDF names its document catalog (/Root) in the trailer or cross-reference stream.
  if (!buffer.includes("/Root", 0, "latin1")) return { ok: false, reason: "The PDF has no pages (no document catalog)." };
  return { ok: true };
}

/**
 * Cheap structural check that a download is a real, complete document. Catches placeholders,
 * truncated uploads and files saved with the wrong extension; it does not render the file.
 */
export function checkDownloadFile(buffer: Buffer | null | undefined, fileName: string): FileCheck {
  if (!buffer || buffer.length === 0) return { ok: false, reason: "The file is empty." };
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".pdf":
      return checkPdf(buffer);
    case ".docx":
    case ".xlsx":
      return startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]) && buffer.includes("[Content_Types].xml", 0, "latin1")
        ? { ok: true }
        : { ok: false, reason: `Not a valid ${ext.slice(1).toUpperCase()} file.` };
    case ".doc":
    case ".xls":
      return startsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
        ? { ok: true }
        : { ok: false, reason: `Not a valid ${ext.slice(1).toUpperCase()} file.` };
    case ".jpg":
    case ".jpeg":
      return startsWith(buffer, [0xff, 0xd8, 0xff]) ? { ok: true } : { ok: false, reason: "Not a valid JPEG image." };
    case ".png":
      return startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) && buffer.includes("IEND", 0, "latin1")
        ? { ok: true }
        : { ok: false, reason: "Not a valid PNG image." };
    default:
      return { ok: true };
  }
}

import "server-only";
import JSZip from "jszip";
import mammoth from "mammoth";
import { MAX_RESUME_SIZE_BYTES, MIN_EXTRACTED_RESUME_CHARACTERS } from "@/lib/resumes/constants";

export type ValidatedResume = { buffer: Buffer; fileName: string };

function hasZipSignature(buffer: Buffer) {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) && (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08);
}

export async function validateDocxUpload(file: File): Promise<{ resume: ValidatedResume | null; error: string | null }> {
  if (!file.name.toLowerCase().endsWith(".docx")) return { resume: null, error: "Please upload a Microsoft Word (.docx) resume." };
  if (file.size === 0) return { resume: null, error: "The resume file is empty." };
  if (file.size > MAX_RESUME_SIZE_BYTES) return { resume: null, error: "The resume must be 4 MB or smaller." };
  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return { resume: null, error: "The resume file could not be read." };
  }
  if (!hasZipSignature(buffer)) return { resume: null, error: "The uploaded file is not a valid DOCX document." };
  try {
    const zip = await JSZip.loadAsync(buffer, { checkCRC32: true });
    if (!zip.file("[Content_Types].xml") || !zip.file("word/document.xml")) return { resume: null, error: "The uploaded file is not a valid DOCX document." };
  } catch {
    return { resume: null, error: "The uploaded file is corrupted or not a valid DOCX document." };
  }
  return { resume: { buffer, fileName: file.name }, error: null };
}

export async function extractResumeText(buffer: Buffer): Promise<{ text: string | null; error: string | null }> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.replace(/\s+/g, " ").trim();
    if (text.length < MIN_EXTRACTED_RESUME_CHARACTERS) return { text: null, error: "The resume contains too little extractable text." };
    return { text, error: null };
  } catch {
    return { text: null, error: "Resume text extraction failed." };
  }
}

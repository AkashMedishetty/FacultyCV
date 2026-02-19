import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { db } from "./db";
import { cvContent } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

const sectionPatterns: Record<string, RegExp> = {
  education:
    /\b(education|academic|qualification|degree|university|college|school|diploma|certificate)\b/i,
  experience:
    /\b(experience|employment|work\s*history|career|position|hospital|clinic|consultant|professor|surgeon)\b/i,
  publications:
    /\b(publication|paper|research|journal|article|study|doi|isbn)\b/i,
  awards:
    /\b(award|honor|honour|achievement|recognition|fellowship|medal|prize)\b/i,
};

export async function parsePDF(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export async function parseDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function parseDocument(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "pdf") return parsePDF(buffer);
  if (ext === "docx" || ext === "doc") return parseDOCX(buffer);
  throw new Error(`Unsupported file type: ${ext}`);
}

export function detectSections(text: string): {
  education: string | null;
  experience: string | null;
  publications: string | null;
  awards: string | null;
  otherContent: string | null;
} {
  const lines = text.split("\n").filter((l) => l.trim());
  const sections: Record<string, string[]> = {
    education: [],
    experience: [],
    publications: [],
    awards: [],
    other: [],
  };

  let currentSection = "other";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this line is a section header
    for (const [section, pattern] of Object.entries(sectionPatterns)) {
      if (
        pattern.test(trimmed) &&
        trimmed.length < 100 &&
        (trimmed === trimmed.toUpperCase() ||
          trimmed.endsWith(":") ||
          trimmed.length < 50)
      ) {
        currentSection = section;
        break;
      }
    }

    sections[currentSection].push(trimmed);
  }

  return {
    education: sections.education.length > 0 ? sections.education.join("\n") : null,
    experience: sections.experience.length > 0 ? sections.experience.join("\n") : null,
    publications: sections.publications.length > 0 ? sections.publications.join("\n") : null,
    awards: sections.awards.length > 0 ? sections.awards.join("\n") : null,
    otherContent: sections.other.length > 0 ? sections.other.join("\n") : null,
  };
}

export async function parseCVAndStore(
  doctorId: string,
  buffer: Buffer,
  filename: string
): Promise<{ rawText: string; sections: ReturnType<typeof detectSections> }> {
  const rawText = await parseDocument(buffer, filename);
  const sections = detectSections(rawText);

  // Upsert CV content
  const existing = await db
    .select()
    .from(cvContent)
    .where(eq(cvContent.doctorId, doctorId));

  if (existing.length > 0) {
    await db
      .update(cvContent)
      .set({
        rawText,
        ...sections,
        sourceFile: filename,
        extractedAt: new Date(),
      })
      .where(eq(cvContent.doctorId, doctorId));
  } else {
    await db.insert(cvContent).values({
      doctorId,
      rawText,
      ...sections,
      sourceFile: filename,
    });
  }

  return { rawText, sections };
}

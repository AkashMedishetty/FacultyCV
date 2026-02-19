import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import * as fs from "fs";
import * as path from "path";

// Dynamic imports for parsers
let pdfParse: any;
let mammoth: any;

async function loadParsers() {
  pdfParse = await import("pdf-parse");
  mammoth = await import("mammoth");
}

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

function detectSections(text: string) {
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

function normalizeName(filename: string): string {
  return filename
    .replace(/^Dr__/, "")
    .replace(/_[a-f0-9]{24}$/i, "")
    .replace(/\.[^.]+$/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .trim();
}

function matchDoctorByFilename(
  filename: string,
  doctors: { id: string; name: string }[]
): { id: string; name: string } | null {
  const normalized = normalizeName(filename);
  const parts = normalized.split(" ").filter((p) => p.length > 1);

  let bestMatch: { id: string; name: string } | null = null;
  let bestScore = 0;

  for (const doc of doctors) {
    const docName = doc.name.toLowerCase();
    let score = 0;
    for (const part of parts) {
      if (docName.includes(part)) score++;
    }
    const ratio = parts.length > 0 ? score / parts.length : 0;
    if (ratio > bestScore && ratio >= 0.5) {
      bestScore = ratio;
      bestMatch = doc;
    }
  }

  return bestMatch;
}

async function extractAndUpload() {
  await loadParsers();

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  // Get all doctors
  const allDoctors = await db.select({ id: schema.doctors.id, name: schema.doctors.name }).from(schema.doctors);
  console.log(`Found ${allDoctors.length} doctors in database`);

  // Process CVs
  const cvsDir = path.join(__dirname, "../../cvs");
  if (fs.existsSync(cvsDir)) {
    const cvFiles = fs.readdirSync(cvsDir);
    console.log(`\nProcessing ${cvFiles.length} CV files...`);

    for (const file of cvFiles) {
      const ext = file.split(".").pop()?.toLowerCase();
      if (!ext || !["pdf", "docx", "doc"].includes(ext)) continue;

      const doctor = matchDoctorByFilename(file, allDoctors);
      if (!doctor) {
        console.log(`  ✗ No match for CV: ${file}`);
        continue;
      }

      try {
        const filePath = path.join(cvsDir, file);
        const buffer = fs.readFileSync(filePath);

        // Parse document
        let rawText = "";
        if (ext === "pdf") {
          const data = await pdfParse(buffer);
          rawText = data.text;
        } else {
          const result = await mammoth.extractRawText({ buffer });
          rawText = result.value;
        }

        const sections = detectSections(rawText);

        // Upload to Blob
        const blob = await put(
          `cvs/${doctor.id}/${file}`,
          new Blob([buffer]),
          { access: "public" }
        );

        // Upsert CV content
        const existing = await db
          .select()
          .from(schema.cvContent)
          .where(eq(schema.cvContent.doctorId, doctor.id));

        if (existing.length > 0) {
          await db
            .update(schema.cvContent)
            .set({ rawText, ...sections, sourceFile: file, extractedAt: new Date() })
            .where(eq(schema.cvContent.doctorId, doctor.id));
        } else {
          await db.insert(schema.cvContent).values({
            doctorId: doctor.id,
            rawText,
            ...sections,
            sourceFile: file,
          });
        }

        // Update doctor record
        await db
          .update(schema.doctors)
          .set({ cvUrl: blob.url, hasCv: true, updatedAt: new Date() })
          .where(eq(schema.doctors.id, doctor.id));

        console.log(`  ✓ CV: ${file} → ${doctor.name}`);
      } catch (err: any) {
        console.error(`  ✗ CV error ${file}: ${err.message}`);
      }
    }
  }

  // Process Photos
  const photosDir = path.join(__dirname, "../../profile-photos");
  if (fs.existsSync(photosDir)) {
    const photoFiles = fs.readdirSync(photosDir);
    console.log(`\nProcessing ${photoFiles.length} photo files...`);

    for (const file of photoFiles) {
      const ext = file.split(".").pop()?.toLowerCase();
      if (!ext || !["jpg", "jpeg", "png"].includes(ext)) continue;

      const doctor = matchDoctorByFilename(file, allDoctors);
      if (!doctor) {
        console.log(`  ✗ No match for photo: ${file}`);
        continue;
      }

      try {
        const filePath = path.join(photosDir, file);
        const buffer = fs.readFileSync(filePath);

        const blob = await put(
          `photos/${doctor.id}/${file}`,
          new Blob([buffer]),
          { access: "public" }
        );

        await db
          .update(schema.doctors)
          .set({ profilePhotoUrl: blob.url, hasPhoto: true, updatedAt: new Date() })
          .where(eq(schema.doctors.id, doctor.id));

        console.log(`  ✓ Photo: ${file} → ${doctor.name}`);
      } catch (err: any) {
        console.error(`  ✗ Photo error ${file}: ${err.message}`);
      }
    }
  }

  console.log("\nExtraction and upload complete!");
}

extractAndUpload().catch(console.error);

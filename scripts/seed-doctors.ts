import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../drizzle/schema";
import * as fs from "fs";
import * as path from "path";

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  // Read CSV
  const csvPath = path.join(__dirname, "../../faculty-data.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  // Simple CSV parser for this specific format
  const lines = csvContent.split("\n");
  const headers = parseCSVLine(lines[0]);

  console.log(`Found ${lines.length - 1} rows`);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });

    const name = row["Name"]?.trim();
    if (!name) continue;

    const id = generateId(name, i);
    const hasPhoto = !!row["Profile Photo URL"]?.trim();
    const hasCv = !!row["CV URL"]?.trim();

    // Insert doctor
    try {
      await db.insert(schema.doctors).values({
        id,
        registrationId: row["Registration ID"] || null,
        name,
        mobile: row["Mobile"] || null,
        email: row["Email"] || null,
        whatsapp: row["WhatsApp"] || null,
        mciNumber: row["MCI Number"] || null,
        certificateName: row["Certificate Name"] || null,
        institution: row["Institution"] || null,
        address: row["Address"] || null,
        qualification: row["Qualification"] || null,
        designation: row["Designation"] || null,
        publications: row["Publications"] || null,
        profilePhotoUrl: row["Profile Photo URL"] || null,
        cvUrl: row["CV URL"] || null,
        hasPhoto,
        hasCv,
      });

      // Insert sessions
      const totalSessions = parseInt(row["Total Sessions"] || "0");
      for (let s = 1; s <= Math.min(totalSessions, 8); s++) {
        const title = row[`Session ${s} Title`]?.trim();
        if (!title) continue;

        const sessionDate = row[`Session ${s} Date`]?.trim() || "";
        const dayNumber = inferDayNumber(sessionDate);

        await db.insert(schema.sessions).values({
          id: `${id}-s${s}`,
          doctorId: id,
          title,
          sessionType: row[`Session ${s} Type`]?.trim() || "talk",
          sessionDate,
          sessionTime: row[`Session ${s} Time`]?.trim() || "",
          venue: row[`Session ${s} Venue`]?.trim() || "",
          outline: row[`Session ${s} Outline`]?.trim() || null,
          dayNumber,
          sessionOrder: s,
        });
      }

      console.log(`✓ ${name} (${totalSessions} sessions)`);
    } catch (err: any) {
      console.error(`✗ ${name}: ${err.message}`);
    }
  }

  console.log("Seeding complete!");
}

function generateId(name: string, index: number): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 40) + `-${index}`;
}

function inferDayNumber(dateStr: string): number {
  if (!dateStr) return 1;
  const d = dateStr.toLowerCase();
  if (d.includes("20") && (d.includes("feb") || d.includes("2/20") || d.includes("20/2"))) return 1;
  if (d.includes("21") && (d.includes("feb") || d.includes("2/21") || d.includes("21/2"))) return 2;
  if (d.includes("22") && (d.includes("feb") || d.includes("2/22") || d.includes("22/2"))) return 3;
  if (d.includes("6") || d.includes("06")) return 1;
  if (d.includes("7") || d.includes("07")) return 2;
  if (d.includes("8") || d.includes("08")) return 3;
  return 1;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

seed().catch(console.error);

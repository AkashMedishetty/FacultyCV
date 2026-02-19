import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../drizzle/schema";
import * as fs from "fs";
import * as path from "path";

interface ProgramEntry {
  dayNumber: number;
  timeSlot: string;
  hall: string;
  title: string;
  speakers: string;
  sessionType: string;
  moderator: string | null;
  chairperson: string | null;
  sortOrder: number;
}

async function seedProgram() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const filePath = path.join(__dirname, "../../scientific-program-content.txt");
  const content = fs.readFileSync(filePath, "utf-8");

  const pages = content.split(/--- Page \d+ ---/).filter((p) => p.trim());
  const entries: ProgramEntry[] = [];
  let sortOrder = 0;

  for (const page of pages) {
    const { day, hall } = detectDayAndHall(page);
    if (day === 0) continue;

    const lines = page.split("\n").filter((l) => l.trim());

    let currentModerator: string | null = null;
    let currentChairperson: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip page headers/footers
      if (isPageHeader(trimmed)) continue;

      // Detect moderator
      const modMatch = trimmed.match(/Moderator\s*:\s*(.+)/i);
      if (modMatch) {
        currentModerator = modMatch[1].trim();
        continue;
      }

      // Detect chairperson
      const chairMatch = trimmed.match(/Chai(?:r)?person\s*:\s*(.+)/i);
      if (chairMatch) {
        currentChairperson = chairMatch[1].trim();
        continue;
      }

      // Parse time-based entries
      const timeMatch = trimmed.match(
        /^(\d{1,2}:\d{2}\s*(?:am|pm|Am|Pm|AM|PM))\s+(.+)/i
      );
      if (timeMatch) {
        const timeSlot = normalizeTime(timeMatch[1]);
        const rest = timeMatch[2].trim();

        // Split into title and speaker
        const { title, speaker } = splitTitleAndSpeaker(rest);

        if (title) {
          sortOrder++;
          const sessionType = detectSessionType(title, trimmed);

          entries.push({
            dayNumber: day,
            timeSlot,
            hall: hall || "Hall A",
            title,
            speakers: speaker || "",
            sessionType,
            moderator: currentModerator,
            chairperson: currentChairperson,
            sortOrder,
          });
        }
        continue;
      }

      // Session header lines (no time prefix but describe a session block)
      const sessionHeaderMatch = trimmed.match(
        /^([A-Z][A-Za-z\s&:,\-]+(?:Session|Section|Oration|Papers|Quiz|Workshop|Forum))/i
      );
      if (
        sessionHeaderMatch &&
        !trimmed.match(/^\d/) &&
        trimmed.length < 120
      ) {
        sortOrder++;
        entries.push({
          dayNumber: day,
          timeSlot: "",
          hall: hall || "Hall A",
          title: sessionHeaderMatch[1].trim(),
          speakers: "",
          sessionType: "header",
          moderator: currentModerator,
          chairperson: currentChairperson,
          sortOrder,
        });
      }
    }
  }

  console.log(`Parsed ${entries.length} program entries`);

  // Insert into database
  for (const entry of entries) {
    try {
      await db.insert(schema.programSessions).values({
        dayNumber: entry.dayNumber,
        timeSlot: entry.timeSlot,
        hall: entry.hall,
        title: entry.title,
        speakers: entry.speakers,
        sessionType: entry.sessionType,
        moderator: entry.moderator,
        chairperson: entry.chairperson,
        sortOrder: entry.sortOrder,
      });
    } catch (err: any) {
      console.error(`Failed to insert: ${entry.title} - ${err.message}`);
    }
  }

  console.log("Program seeding complete!");
}

function detectDayAndHall(page: string): { day: number; hall: string } {
  let day = 0;
  let hall = "Hall A";

  if (/Day[\s-]*1|20-2-2026|Feb\s*20/i.test(page)) day = 1;
  else if (/Day[\s-]*2|21-2-2026|Feb\s*21/i.test(page)) day = 2;
  else if (/Day[\s-]*3|22-2-2026|Feb\s*22/i.test(page)) day = 3;

  if (/Hall\s*C/i.test(page)) hall = "Hall C";
  else if (/Hall\s*B/i.test(page)) hall = "Hall B";
  else if (/Hall\s*A/i.test(page)) hall = "Hall A";

  return { day, hall };
}

function isPageHeader(line: string): boolean {
  return (
    /^(Symposium|Specialty|Practice|Hall [ABC]|Time\s+Session)/i.test(line) ||
    /^\d+-\d+-\d+/.test(line) ||
    /^(Saturday|Sunday|Friday)/i.test(line) ||
    line === "Time   Session and Topics   Speakers"
  );
}

function normalizeTime(time: string): string {
  return time.replace(/\s+/g, " ").trim();
}

function splitTitleAndSpeaker(text: string): {
  title: string;
  speaker: string;
} {
  // Common patterns: "Topic   Dr. Name, City" or "Topic   Dr. Name"
  const drMatch = text.match(
    /^(.+?)\s{2,}((?:Dr\.|Prof\.|Delegates|Panel|Judges).*)$/
  );
  if (drMatch) {
    return { title: drMatch[1].trim(), speaker: drMatch[2].trim() };
  }

  // If no clear separator, check for "Dr." anywhere
  const drIdx = text.lastIndexOf("Dr.");
  if (drIdx > 20) {
    return {
      title: text.substring(0, drIdx).trim(),
      speaker: text.substring(drIdx).trim(),
    };
  }

  return { title: text.trim(), speaker: "" };
}

function detectSessionType(title: string, fullLine: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("workshop")) return "workshop";
  if (lower.includes("oration")) return "oration";
  if (lower.includes("open forum")) return "forum";
  if (lower.includes("case discussion")) return "case-discussion";
  if (lower.includes("free paper")) return "free-paper";
  if (lower.includes("medal")) return "medal";
  if (lower.includes("quiz")) return "quiz";
  if (lower.includes("meet the master")) return "meet-the-masters";
  if (lower.includes("lunch") || lower.includes("dinner") || lower.includes("banquet"))
    return "break";
  if (lower.includes("inaugur") || lower.includes("valedictory"))
    return "ceremony";
  return "talk";
}

seedProgram().catch(console.error);

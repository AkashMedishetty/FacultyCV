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

    // The PDF text is all on one line per page, separated by multiple spaces.
    // Split on time patterns like "8:00 Am", "10:30 pm", etc.
    const timePattern = /(\d{1,2}:\d{2}\s*(?:am|pm))/gi;
    const pageText = page.replace(/\s+/g, " ").trim();

    // Find all time positions
    const timeMatches: { time: string; index: number }[] = [];
    let match;
    while ((match = timePattern.exec(pageText)) !== null) {
      timeMatches.push({ time: match[1].trim(), index: match.index });
    }

    let currentModerator: string | null = null;
    let currentChairperson: string | null = null;

    for (let i = 0; i < timeMatches.length; i++) {
      const startIdx = timeMatches[i].index + timeMatches[i].time.length;
      const endIdx = i + 1 < timeMatches.length ? timeMatches[i + 1].index : pageText.length;
      const segment = pageText.substring(startIdx, endIdx).trim();
      const timeSlot = normalizeTime(timeMatches[i].time);

      // Skip footer lines
      if (!segment || isFooter(segment)) continue;

      // Check for moderator/chairperson in segment
      const modMatch = segment.match(/Moderator\s*:\s*(Dr\.[^,]+(?:,\s*\w+)?)/i);
      if (modMatch) currentModerator = modMatch[1].trim();
      const chairMatch = segment.match(/Chai(?:r)?person\s*:\s*(Dr\.[^,]+(?:,\s*\w+)?)/i);
      if (chairMatch) currentChairperson = chairMatch[1].trim();

      // Split segment into title and speaker using double-space separator
      const { title, speaker } = splitTitleAndSpeaker(segment);
      if (!title || title.length < 3) continue;

      // Skip if it's just a session header with moderator info
      if (/^(Moderator|Chairperson|Chaiperson)\s*:/i.test(title)) continue;

      sortOrder++;
      entries.push({
        dayNumber: day,
        timeSlot,
        hall: hall || "Hall A",
        title: cleanTitle(title),
        speakers: speaker || "",
        sessionType: detectSessionType(title),
        moderator: currentModerator,
        chairperson: currentChairperson,
        sortOrder,
      });
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

  // Check for day indicators - be more specific to avoid false matches
  if (/Day[\s-]*1|20-2-2026|Friday/i.test(page)) day = 1;
  else if (/Day[\s-]*3|22-2-2026|Feb\s*22/i.test(page)) day = 3;
  else if (/Day[\s-]*2|21-2-2026|Saturday/i.test(page)) day = 2;

  // Hall detection - check for the last/most specific hall mention
  if (/Hall\s*C/i.test(page)) hall = "Hall C";
  else if (/Hall\s*B/i.test(page)) hall = "Hall B";
  else if (/Hall\s*A/i.test(page)) hall = "Hall A";

  return { day, hall };
}

function isFooter(text: string): boolean {
  return (
    /^(Symposium|Specialty|Practice|Hall [ABC])\s*(Day|Specialty)/i.test(text) ||
    /^\d+-\d+-\d+/.test(text) ||
    /^Time\s+Session/i.test(text)
  );
}

function normalizeTime(time: string): string {
  return time.replace(/\s+/g, " ").trim();
}

function cleanTitle(title: string): string {
  // Remove trailing footer text
  return title
    .replace(/\s*(Symposium|Specialty|Hall [ABC]).*$/i, "")
    .replace(/\s*Day-\d.*$/i, "")
    .trim();
}

function splitTitleAndSpeaker(text: string): { title: string; speaker: string } {
  // Look for double-space separator before Dr./Prof./Delegates
  const drMatch = text.match(
    /^(.+?)\s{2,}((?:Dr\.|Prof\.|Delegates|Panel|Judges|All\s).*)$/
  );
  if (drMatch) {
    return { title: drMatch[1].trim(), speaker: drMatch[2].trim() };
  }

  // Check for "Dr." with enough preceding text
  const drIdx = text.lastIndexOf("Dr.");
  if (drIdx > 15) {
    return {
      title: text.substring(0, drIdx).trim().replace(/\s+$/, ""),
      speaker: text.substring(drIdx).trim(),
    };
  }

  return { title: text.trim(), speaker: "" };
}

function detectSessionType(title: string): string {
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

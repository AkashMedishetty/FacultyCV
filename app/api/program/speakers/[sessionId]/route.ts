import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { programSessions, doctors } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const sessionId = parseInt(params.sessionId);
  if (isNaN(sessionId)) {
    return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
  }

  const [session] = await db
    .select()
    .from(programSessions)
    .where(eq(programSessions.id, sessionId));

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Parse speaker names from the session's speakers field
  const speakerNames = session.speakers
    ? session.speakers
        .split(/[,;&]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 2)
    : [];

  // Match speakers to doctor records using fuzzy name matching
  const matchedDoctors = [];
  for (const speakerName of speakerNames) {
    // Extract just the name part (remove city, titles like "Dr.")
    const cleanName = speakerName
      .replace(/^(Dr\.|Prof\.)\s*/i, "")
      .replace(/,\s*\w+$/, "")
      .trim();

    if (!cleanName) continue;

    // Search for matching doctors
    const nameParts = cleanName.split(/\s+/).filter((p) => p.length > 1);
    const allDocs = await db.select().from(doctors);

    const matched = allDocs.find((doc) => {
      const docLower = doc.name.toLowerCase();
      const matchCount = nameParts.filter((part) =>
        docLower.includes(part.toLowerCase())
      ).length;
      return matchCount >= Math.ceil(nameParts.length * 0.5);
    });

    if (matched) {
      matchedDoctors.push({
        ...matched,
        speakerLabel: speakerName,
      });
    } else {
      matchedDoctors.push({
        id: null,
        name: speakerName,
        speakerLabel: speakerName,
        profilePhotoUrl: null,
        institution: null,
        qualification: null,
        designation: null,
      });
    }
  }

  return NextResponse.json({
    session,
    speakers: matchedDoctors,
  });
}

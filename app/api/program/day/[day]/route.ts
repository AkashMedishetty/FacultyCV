import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { programSessions } from "@/drizzle/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: { day: string } }
) {
  const dayNumber = parseInt(params.day);
  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 3) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }

  const daySessions = await db
    .select()
    .from(programSessions)
    .where(eq(programSessions.dayNumber, dayNumber))
    .orderBy(asc(programSessions.sortOrder));

  const titles = ["", "Symposium On Bone Union & Workshops", "Specialty Sessions", "Practice & Regenerative Sessions"];
  const dates = ["", "Feb 20, 2026", "Feb 21, 2026", "Feb 22, 2026"];

  return NextResponse.json({
    day: dayNumber,
    date: dates[dayNumber],
    title: titles[dayNumber],
    sessions: daySessions,
  });
}

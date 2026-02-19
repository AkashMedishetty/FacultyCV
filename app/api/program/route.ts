import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { programSessions } from "@/drizzle/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const allSessions = await db
    .select()
    .from(programSessions)
    .orderBy(asc(programSessions.dayNumber), asc(programSessions.sortOrder));

  const days = [
    {
      day: 1,
      date: "Feb 20, 2026",
      title: "Symposium On Bone Union & Workshops",
      sessions: allSessions.filter((s) => s.dayNumber === 1),
    },
    {
      day: 2,
      date: "Feb 21, 2026",
      title: "Specialty Sessions",
      sessions: allSessions.filter((s) => s.dayNumber === 2),
    },
    {
      day: 3,
      date: "Feb 22, 2026",
      title: "Practice & Regenerative Sessions",
      sessions: allSessions.filter((s) => s.dayNumber === 3),
    },
  ];

  return NextResponse.json(days);
}

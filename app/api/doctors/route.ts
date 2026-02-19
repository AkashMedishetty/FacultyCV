import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { doctors, sessions } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase();
  const missingOnly = searchParams.get("missing") === "true";
  const day = searchParams.get("day");

  let allDoctors = await db.select().from(doctors);

  if (search) {
    allDoctors = allDoctors.filter(
      (d) =>
        d.name.toLowerCase().includes(search) ||
        d.institution?.toLowerCase().includes(search) ||
        d.qualification?.toLowerCase().includes(search)
    );
  }

  if (missingOnly) {
    allDoctors = allDoctors.filter((d) => !d.hasPhoto || !d.hasCv);
  }

  // Get sessions for each doctor
  const doctorsWithSessions = await Promise.all(
    allDoctors.map(async (doc) => {
      let docSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.doctorId, doc.id));

      if (day) {
        docSessions = docSessions.filter(
          (s) => s.dayNumber === parseInt(day)
        );
      }

      return { ...doc, sessions: docSessions };
    })
  );

  return NextResponse.json(doctorsWithSessions);
}

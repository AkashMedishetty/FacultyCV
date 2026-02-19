import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { doctors, sessions, cvContent } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  const doctorSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.doctorId, id));

  const [cv] = await db
    .select()
    .from(cvContent)
    .where(eq(cvContent.doctorId, id));

  return NextResponse.json({
    ...doctor,
    sessions: doctorSessions,
    cvContent: cv || null,
  });
}

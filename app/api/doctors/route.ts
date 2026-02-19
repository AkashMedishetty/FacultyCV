import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { doctors, sessions } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function fuzzyMatch(text: string, query: string): number {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact substring match = highest score
  if (textLower.includes(queryLower)) return 100;

  // Split query into words and check how many match
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 1);
  if (queryWords.length === 0) return 0;

  let matchedWords = 0;
  for (const word of queryWords) {
    if (textLower.includes(word)) {
      matchedWords++;
    } else {
      // Check for partial matches (at least 3 chars)
      if (word.length >= 3) {
        for (let len = word.length; len >= 3; len--) {
          const sub = word.substring(0, len);
          if (textLower.includes(sub)) {
            matchedWords += len / word.length * 0.7;
            break;
          }
        }
      }
    }
  }

  return (matchedWords / queryWords.length) * 80;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const missingOnly = searchParams.get("missing") === "true";
  const day = searchParams.get("day");

  let allDoctors = await db.select().from(doctors);

  if (search && search.length > 0) {
    // Fuzzy search across name, institution, qualification
    const scored = allDoctors.map((d) => {
      const nameScore = fuzzyMatch(d.name, search);
      const instScore = d.institution ? fuzzyMatch(d.institution, search) * 0.6 : 0;
      const qualScore = d.qualification ? fuzzyMatch(d.qualification, search) * 0.4 : 0;
      const score = Math.max(nameScore, instScore, qualScore);
      return { ...d, _score: score };
    });

    allDoctors = scored
      .filter((d) => d._score > 20)
      .sort((a, b) => b._score - a._score)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ _score, ...rest }) => rest);
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

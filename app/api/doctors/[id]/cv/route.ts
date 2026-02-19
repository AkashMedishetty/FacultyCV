import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { doctors, cvContent } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { put, del } from "@vercel/blob";
import { parseDocument, detectSections } from "@/lib/parser";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const contentType = request.headers.get("content-type") || "";

  // Manual CV entry (JSON body)
  if (contentType.includes("application/json")) {
    const body = await request.json();
    const { rawText, education, experience, publications, awards } = body;

    if (!rawText && !education && !experience && !publications && !awards) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const combinedRaw = rawText || [education, experience, publications, awards].filter(Boolean).join("\n\n");

    const existing = await db
      .select()
      .from(cvContent)
      .where(eq(cvContent.doctorId, id));

    if (existing.length > 0) {
      await db
        .update(cvContent)
        .set({
          rawText: combinedRaw,
          education: education || existing[0].education,
          experience: experience || existing[0].experience,
          publications: publications || existing[0].publications,
          awards: awards || existing[0].awards,
          otherContent: null,
          sourceFile: "manual-entry",
          extractedAt: new Date(),
        })
        .where(eq(cvContent.doctorId, id));
    } else {
      await db.insert(cvContent).values({
        doctorId: id,
        rawText: combinedRaw,
        education: education || null,
        experience: experience || null,
        publications: publications || null,
        awards: awards || null,
        sourceFile: "manual-entry",
      });
    }

    await db
      .update(doctors)
      .set({ hasCv: true, updatedAt: new Date() })
      .where(eq(doctors.id, id));

    return NextResponse.json({ success: true, source: "manual" });
  }

  // File upload (FormData)
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const validExtensions = ["pdf", "docx", "doc"];
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !validExtensions.includes(ext)) {
    return NextResponse.json(
      { error: "Invalid file type. Accepted: PDF, DOCX" },
      { status: 400 }
    );
  }

  // Delete old CV blob if exists
  const [existingDoc] = await db.select().from(doctors).where(eq(doctors.id, id));
  if (existingDoc?.cvUrl) {
    try {
      await del(existingDoc.cvUrl);
    } catch {
      // Old blob may not exist
    }
  }

  const blob = await put(`cvs/${id}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  let rawText = "";
  try {
    rawText = await parseDocument(buffer, file.name);
  } catch {
    rawText = "Failed to extract text from document";
  }

  const sections = detectSections(rawText);

  const existing = await db
    .select()
    .from(cvContent)
    .where(eq(cvContent.doctorId, id));

  if (existing.length > 0) {
    await db
      .update(cvContent)
      .set({
        rawText,
        ...sections,
        sourceFile: file.name,
        extractedAt: new Date(),
      })
      .where(eq(cvContent.doctorId, id));
  } else {
    await db.insert(cvContent).values({
      doctorId: id,
      rawText,
      ...sections,
      sourceFile: file.name,
    });
  }

  await db
    .update(doctors)
    .set({
      cvUrl: blob.url,
      hasCv: true,
      updatedAt: new Date(),
    })
    .where(eq(doctors.id, id));

  return NextResponse.json({
    url: blob.url,
    cvContent: { rawText, ...sections },
  });
}

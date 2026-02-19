import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { doctors, cvContent } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { parseDocument, detectSections } from "@/lib/parser";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
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

  // Upload to Vercel Blob
  const blob = await put(`cvs/${id}/${file.name}`, file, {
    access: "public",
  });

  // Parse the document
  const buffer = Buffer.from(await file.arrayBuffer());
  let rawText = "";
  try {
    rawText = await parseDocument(buffer, file.name);
  } catch {
    rawText = "Failed to extract text from document";
  }

  const sections = detectSections(rawText);

  // Upsert CV content
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

  // Update doctor record
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

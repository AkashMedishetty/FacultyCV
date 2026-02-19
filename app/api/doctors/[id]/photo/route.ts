import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { doctors } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";

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

  const validTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (!validTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Accepted: JPG, PNG" },
      { status: 400 }
    );
  }

  const blob = await put(`photos/${id}/${file.name}`, file, {
    access: "public",
  });

  await db
    .update(doctors)
    .set({
      profilePhotoUrl: blob.url,
      hasPhoto: true,
      updatedAt: new Date(),
    })
    .where(eq(doctors.id, id));

  return NextResponse.json({ url: blob.url });
}

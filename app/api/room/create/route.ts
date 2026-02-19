import { NextResponse } from "next/server";
import { initRoom } from "@/lib/kv";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST() {
  const code = generateRoomCode();

  await db.insert(rooms).values({ code });
  await initRoom(code);

  return NextResponse.json({ code });
}

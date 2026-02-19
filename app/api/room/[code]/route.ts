import { NextResponse } from "next/server";
import { getRoomState, getRoomVersion } from "@/lib/kv";

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  const state = await getRoomState(params.code);
  if (!state) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const version = await getRoomVersion(params.code);
  return NextResponse.json({ ...state, version });
}

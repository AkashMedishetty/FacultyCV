import { NextResponse } from "next/server";
import { setRoomState, getRoomState } from "@/lib/kv";
import { RoomState } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  const body = await request.json();
  const { type, doctorId, day, sessionId } = body;

  const existing = await getRoomState(params.code);
  if (!existing) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  let newState: RoomState;

  switch (type) {
    case "display-doctor":
      newState = {
        currentView: "doctor",
        currentDoctorId: doctorId,
        currentDay: null,
        currentSessionId: null,
        lastUpdated: new Date().toISOString(),
      };
      break;
    case "display-program":
      newState = {
        currentView: "program",
        currentDoctorId: null,
        currentDay: day,
        currentSessionId: null,
        lastUpdated: new Date().toISOString(),
      };
      break;
    case "display-session":
      newState = {
        currentView: "session",
        currentDoctorId: null,
        currentDay: null,
        currentSessionId: sessionId,
        lastUpdated: new Date().toISOString(),
      };
      break;
    case "display-idle":
    default:
      newState = {
        currentView: "idle",
        currentDoctorId: null,
        currentDay: null,
        currentSessionId: null,
        lastUpdated: new Date().toISOString(),
      };
  }

  await setRoomState(params.code, newState);
  return NextResponse.json(newState);
}

import { Redis } from "@upstash/redis";
import { RoomState } from "./types";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function getRoomState(roomCode: string): Promise<RoomState | null> {
  return redis.get<RoomState>(`room:${roomCode}:state`);
}

export async function setRoomState(
  roomCode: string,
  state: RoomState
): Promise<void> {
  await redis.set(`room:${roomCode}:state`, state);
  await redis.incr(`room:${roomCode}:version`);
}

export async function getRoomVersion(roomCode: string): Promise<number> {
  const version = await redis.get<number>(`room:${roomCode}:version`);
  return version ?? 0;
}

export async function initRoom(roomCode: string): Promise<void> {
  const state: RoomState = {
    currentView: "idle",
    currentDoctorId: null,
    currentDay: null,
    currentSessionId: null,
    lastUpdated: new Date().toISOString(),
  };
  await redis.set(`room:${roomCode}:state`, state);
  await redis.set(`room:${roomCode}:version`, 0);
}

export { redis };

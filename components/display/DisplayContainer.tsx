"use client";
import { useEffect, useState, useCallback } from "react";
import { RoomState, Doctor, ProgramSession } from "@/lib/types";
import { IdleScreen } from "./IdleScreen";
import { DoctorProfileView } from "./DoctorProfileView";
import { ProgramView } from "./ProgramView";

interface DisplayContainerProps {
  roomCode: string;
}

export function DisplayContainer({ roomCode }: DisplayContainerProps) {
  const [roomState, setRoomState] = useState<RoomState>({
    currentView: "idle",
    currentDoctorId: null,
    currentDay: null,
    currentSessionId: null,
    lastUpdated: new Date().toISOString(),
  });
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [programSessions, setProgramSessions] = useState<ProgramSession[]>([]);
  const [connected, setConnected] = useState(false);

  // SSE connection
  useEffect(() => {
    const eventSource = new EventSource(`/api/room/${roomCode}/stream`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setRoomState(data);
      setConnected(true);
    };

    eventSource.onerror = () => {
      setConnected(false);
      // EventSource auto-reconnects
    };

    return () => eventSource.close();
  }, [roomCode]);

  // Fetch doctor when state changes
  const fetchDoctor = useCallback(async (doctorId: string) => {
    const res = await fetch(`/api/doctors/${doctorId}`);
    if (res.ok) {
      const data = await res.json();
      setDoctor(data);
    }
  }, []);

  // Fetch program when state changes
  const fetchProgram = useCallback(async (day: number) => {
    const res = await fetch(`/api/program/day/${day}`);
    if (res.ok) {
      const data = await res.json();
      setProgramSessions(data.sessions);
    }
  }, []);

  useEffect(() => {
    if (roomState.currentView === "doctor" && roomState.currentDoctorId) {
      fetchDoctor(roomState.currentDoctorId);
    } else if (roomState.currentView === "program" && roomState.currentDay) {
      fetchProgram(roomState.currentDay);
    }
  }, [roomState, fetchDoctor, fetchProgram]);

  // Connection indicator
  const connectionDot = (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <div
        className={`w-3 h-3 rounded-full ${
          connected ? "bg-green-400" : "bg-red-400"
        } animate-pulse`}
      />
      <span className="text-xs text-secondary/40">
        {connected ? "Connected" : "Reconnecting..."}
      </span>
    </div>
  );

  return (
    <>
      {connectionDot}
      {roomState.currentView === "idle" && <IdleScreen />}
      {roomState.currentView === "doctor" && doctor && (
        <DoctorProfileView doctor={doctor} />
      )}
      {roomState.currentView === "program" && roomState.currentDay && (
        <ProgramView day={roomState.currentDay} sessions={programSessions} />
      )}
    </>
  );
}

"use client";
import { useEffect, useState, useCallback } from "react";
import { ProgramSession } from "@/lib/types";
import { Button } from "../shared/Button";

interface Speaker {
  id: string | null;
  name?: string;
  speakerLabel: string;
  profilePhotoUrl?: string | null;
  institution?: string | null;
  qualification?: string | null;
  designation?: string | null;
}

interface ProgramNavigatorProps {
  onDisplayProgram: (day: number) => void;
  onDisplayDoctor: (doctorId: string) => void;
  onSessionSelect: (sessionTitle: string | null) => void;
}

export function ProgramNavigator({
  onDisplayProgram,
  onDisplayDoctor,
  onSessionSelect,
}: ProgramNavigatorProps) {
  const [sessions, setSessions] = useState<ProgramSession[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedHall, setSelectedHall] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<ProgramSession | null>(null);
  const [sessionSpeakers, setSessionSpeakers] = useState<Speaker[]>([]);
  const [currentSpeakerIdx, setCurrentSpeakerIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/program/day/${selectedDay}`);
    if (res.ok) {
      const data = await res.json();
      setSessions(data.sessions || []);
    }
    setLoading(false);
  }, [selectedDay]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const halls = Array.from(new Set(sessions.map((s) => s.hall).filter(Boolean)));
  const filteredSessions = selectedHall
    ? sessions.filter((s) => s.hall === selectedHall)
    : sessions;

  const handleSessionClick = async (session: ProgramSession) => {
    setSelectedSession(session);
    setCurrentSpeakerIdx(0);
    onSessionSelect(session.title);

    // Fetch speakers for this session
    const res = await fetch(`/api/program/speakers/${session.id}`);
    if (res.ok) {
      const data = await res.json();
      setSessionSpeakers(data.speakers || []);
    }
  };

  const clearSession = () => {
    setSelectedSession(null);
    setSessionSpeakers([]);
    setCurrentSpeakerIdx(0);
    onSessionSelect(null);
  };

  const displayCurrentSpeaker = () => {
    const speaker = sessionSpeakers[currentSpeakerIdx];
    if (speaker?.id) {
      onDisplayDoctor(speaker.id);
    }
  };

  const nextSpeaker = () => {
    if (currentSpeakerIdx < sessionSpeakers.length - 1) {
      const next = currentSpeakerIdx + 1;
      setCurrentSpeakerIdx(next);
      if (sessionSpeakers[next]?.id) {
        onDisplayDoctor(sessionSpeakers[next].id);
      }
    }
  };

  const prevSpeaker = () => {
    if (currentSpeakerIdx > 0) {
      const prev = currentSpeakerIdx - 1;
      setCurrentSpeakerIdx(prev);
      if (sessionSpeakers[prev]?.id) {
        onDisplayDoctor(sessionSpeakers[prev].id);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Day selector */}
      <div className="flex gap-1 mb-3">
        {[1, 2, 3].map((d) => (
          <button
            key={d}
            onClick={() => {
              setSelectedDay(d);
              setSelectedHall(null);
              clearSession();
            }}
            className={`flex-1 py-2 text-xs rounded-lg transition-all ${
              selectedDay === d
                ? "bg-accent text-white"
                : "neu-button text-secondary/70"
            }`}
          >
            Day {d}
          </button>
        ))}
      </div>

      {/* Hall filter */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setSelectedHall(null)}
          className={`px-2 py-1 text-xs rounded-lg ${
            !selectedHall ? "bg-primary text-secondary" : "neu-button text-secondary/60"
          }`}
        >
          All
        </button>
        {halls.map((h) => (
          <button
            key={h}
            onClick={() => setSelectedHall(h)}
            className={`px-2 py-1 text-xs rounded-lg ${
              selectedHall === h ? "bg-primary text-secondary" : "neu-button text-secondary/60"
            }`}
          >
            {h}
          </button>
        ))}
      </div>

      {/* Display program button */}
      <Button
        variant="primary"
        size="sm"
        className="w-full mb-3"
        onClick={() => onDisplayProgram(selectedDay)}
      >
        📋 Display Day {selectedDay} Program
      </Button>

      {/* Selected session speakers */}
      {selectedSession && sessionSpeakers.length > 0 && (
        <div className="mb-3 p-3 bg-accent/10 rounded-lg border border-accent/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-accent truncate flex-1">
              {selectedSession.title}
            </p>
            <button
              onClick={clearSession}
              className="text-xs text-secondary/40 hover:text-secondary ml-2"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-secondary/60 mb-2">
            Speaker {currentSpeakerIdx + 1} of {sessionSpeakers.length}
          </p>
          <div className="flex gap-1 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevSpeaker}
              disabled={currentSpeakerIdx === 0}
              className="flex-1"
            >
              ← Prev
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={displayCurrentSpeaker}
              className="flex-1"
            >
              Display
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextSpeaker}
              disabled={currentSpeakerIdx >= sessionSpeakers.length - 1}
              className="flex-1"
            >
              Next →
            </Button>
          </div>
          {/* Speaker list */}
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {sessionSpeakers.map((sp, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setCurrentSpeakerIdx(idx);
                  if (sp.id) onDisplayDoctor(sp.id);
                }}
                className={`text-xs px-2 py-1 rounded cursor-pointer ${
                  idx === currentSpeakerIdx
                    ? "bg-accent text-white"
                    : "hover:bg-surface-sunken text-secondary/70"
                }`}
              >
                {idx + 1}. {sp.name || sp.speakerLabel}
                {!sp.id && " (unlinked)"}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session list */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {loading ? (
          <p className="text-xs text-secondary/40 text-center py-4">Loading...</p>
        ) : (
          filteredSessions
            .filter((s) => s.sessionType !== "header")
            .map((session) => (
              <div
                key={session.id}
                onClick={() => handleSessionClick(session)}
                className={`p-2 rounded-lg cursor-pointer text-xs transition-all ${
                  selectedSession?.id === session.id
                    ? "bg-accent/20 border border-accent/40"
                    : "hover:bg-surface-sunken border border-transparent"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-accent font-mono whitespace-nowrap">
                    {session.timeSlot}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-secondary font-medium leading-tight truncate">
                      {session.title}
                    </p>
                    {session.speakers && (
                      <p className="text-secondary/50 truncate mt-0.5">
                        {session.speakers}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

"use client";
import { ProgramSession } from "@/lib/types";
import { Logo } from "../shared/Logo";

interface ProgramViewProps {
  day: number;
  sessions: ProgramSession[];
}

export function ProgramView({ day, sessions }: ProgramViewProps) {
  const dayTitles = [
    "",
    "Day 1 - Symposium & Workshops",
    "Day 2 - Specialty Sessions",
    "Day 3 - Practice & Regenerative",
  ];
  const dayDates = ["", "Friday, Feb 20", "Saturday, Feb 21", "Sunday, Feb 22"];

  const halls = Array.from(new Set(sessions.map((s) => s.hall).filter(Boolean)));

  return (
    <div className="min-h-screen brand-gradient p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <Logo size="sm" />
        <div className="text-right">
          <h2 className="text-2xl font-bold text-secondary">
            {dayTitles[day]}
          </h2>
          <p className="text-sm text-accent">{dayDates[day]}</p>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-3 mb-4">
        {[1, 2, 3].map((d) => (
          <div
            key={d}
            className={`px-4 py-2 rounded-neu-sm text-sm font-medium ${
              d === day
                ? "bg-accent text-white shadow-neu-button"
                : "neu-pressed text-secondary/60"
            }`}
          >
            Day {d}
          </div>
        ))}
      </div>

      {/* Sessions by hall */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[calc(100vh-180px)]">
        {halls.map((hall) => (
          <div key={hall} className="neu-card p-4">
            <h3 className="text-lg font-bold text-secondary mb-3 pb-2 border-b border-accent/30">
              📍 {hall}
            </h3>
            <div className="space-y-2">
              {sessions
                .filter((s) => s.hall === hall)
                .map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: ProgramSession }) {
  const isCurrentTime = false; // Could implement time-based highlighting

  return (
    <div
      className={`p-3 rounded-lg transition-all ${
        isCurrentTime
          ? "bg-accent/10 border-l-4 border-accent"
          : "bg-surface hover:bg-surface-sunken"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-xs font-mono text-accent whitespace-nowrap mt-0.5">
          {session.timeSlot}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-secondary leading-tight">
            {session.title}
          </p>
          {session.speakers && (
            <p className="text-xs text-secondary/60 mt-1">
              {session.speakers}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

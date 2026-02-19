"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Doctor, RoomState } from "@/lib/types";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/shared/Button";
import { DoctorCard } from "@/components/controller/DoctorCard";
import { DoctorPreview } from "@/components/controller/DoctorPreview";
import { ProgramNavigator } from "@/components/controller/ProgramNavigator";

export default function ControllerPage({
  params,
}: {
  params: { roomCode: string };
}) {
  const { roomCode } = params;
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sidebarView, setSidebarView] = useState<"doctors" | "sessions">("doctors");
  const [dayFilter, setDayFilter] = useState<number | null>(null);
  const [showMissing, setShowMissing] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDisplay, setCurrentDisplay] = useState<RoomState | null>(null);
  const [displayedDoctor, setDisplayedDoctor] = useState<Doctor | null>(null);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const fetchDoctors = useCallback(async () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (showMissing) params.set("missing", "true");
    if (dayFilter) params.set("day", dayFilter.toString());

    const res = await fetch(`/api/doctors?${params}`);
    if (res.ok) {
      const data = await res.json();
      setDoctors(data);
    }
    setLoading(false);
  }, [debouncedSearch, showMissing, dayFilter]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Track current display state via SSE
  useEffect(() => {
    const eventSource = new EventSource(`/api/room/${roomCode}/stream`);
    eventSource.onmessage = (event) => {
      const state: RoomState = JSON.parse(event.data);
      setCurrentDisplay(state);
      // Fetch displayed doctor info
      if (state.currentView === "doctor" && state.currentDoctorId) {
        fetch(`/api/doctors/${state.currentDoctorId}`)
          .then((r) => r.json())
          .then((d) => setDisplayedDoctor(d))
          .catch(() => {});
      } else {
        setDisplayedDoctor(null);
      }
    };
    return () => eventSource.close();
  }, [roomCode]);

  const broadcast = async (command: Record<string, unknown>) => {
    await fetch(`/api/room/${roomCode}/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });
  };

  const displayDoctor = (doctorId: string) => {
    broadcast({ type: "display-doctor", doctorId });
  };

  const displayProgram = (day: number) => {
    broadcast({ type: "display-program", day });
  };

  const displayIdle = () => {
    broadcast({ type: "display-idle" });
  };

  const handleSelectDoctor = async (doctor: Doctor) => {
    const res = await fetch(`/api/doctors/${doctor.id}`);
    if (res.ok) {
      const full = await res.json();
      setSelectedDoctor(full);
    }
  };

  const displayLabel = currentDisplay
    ? currentDisplay.currentView === "doctor" && displayedDoctor
      ? `🖥️ ${displayedDoctor.name}`
      : currentDisplay.currentView === "program"
      ? `📋 Day ${currentDisplay.currentDay} Program`
      : "🏠 Idle"
    : "Not connected";

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-surface-raised shadow-neu-raised-sm px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <div>
            <h1 className="text-lg font-bold text-secondary">Controller</h1>
            <p className="text-xs text-secondary/60">
              Room: <span className="font-mono font-bold text-accent">{roomCode}</span>
            </p>
          </div>
        </div>
        {/* Current display indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-secondary/80 max-w-48 truncate">{displayLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={displayIdle}>
            🏠 Idle
          </Button>
          <Button variant="primary" size="sm" onClick={() => displayProgram(1)}>
            📋 Program
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-surface-raised shadow-neu-raised-sm p-4 overflow-y-auto flex-shrink-0">
          <div className="flex gap-1 mb-4">
            <button
              onClick={() => setSidebarView("doctors")}
              className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${
                sidebarView === "doctors" ? "bg-secondary text-white" : "neu-button text-secondary/70"
              }`}
            >
              👨‍⚕️ Doctors
            </button>
            <button
              onClick={() => setSidebarView("sessions")}
              className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${
                sidebarView === "sessions" ? "bg-secondary text-white" : "neu-button text-secondary/70"
              }`}
            >
              📋 Sessions
            </button>
          </div>

          {sidebarView === "doctors" ? (
            <>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search doctors (fuzzy)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-neu-sm shadow-neu-pressed bg-surface text-secondary text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                {debouncedSearch && (
                  <p className="text-xs text-accent mt-1">
                    {doctors.length} match{doctors.length !== 1 ? "es" : ""} for &quot;{debouncedSearch}&quot;
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-semibold text-secondary/60 uppercase tracking-wider">Day</label>
                  <div className="flex gap-1 mt-1">
                    {[null, 1, 2, 3].map((d) => (
                      <button
                        key={d ?? "all"}
                        onClick={() => setDayFilter(d)}
                        className={`flex-1 py-1 text-xs rounded-lg transition-all ${
                          dayFilter === d ? "bg-accent text-white" : "neu-button text-secondary/70"
                        }`}
                      >
                        {d ? `D${d}` : "All"}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMissing}
                    onChange={(e) => setShowMissing(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs text-secondary/70">Missing data only</span>
                </label>
              </div>

              <div className="border-t border-surface-sunken pt-3">
                <p className="text-xs font-semibold text-secondary/60 uppercase tracking-wider mb-2">Display Program</p>
                {[1, 2, 3].map((d) => (
                  <button
                    key={d}
                    onClick={() => displayProgram(d)}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-primary/10 text-secondary/80 transition-colors"
                  >
                    Day {d} - {d === 1 ? "Symposium" : d === 2 ? "Specialty" : "Practice"}
                  </button>
                ))}
              </div>

              <div className="border-t border-surface-sunken pt-3 mt-3">
                <p className="text-xs text-secondary/50">
                  {doctors.length} doctors • {doctors.filter((d) => !d.hasPhoto).length} no photo • {doctors.filter((d) => !d.hasCv).length} no CV
                </p>
              </div>
            </>
          ) : (
            <ProgramNavigator
              onDisplayProgram={displayProgram}
              onDisplayDoctor={displayDoctor}
              onSessionSelect={(title) => setSessionFilter(title)}
            />
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 flex overflow-hidden">
          {/* Doctor grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-secondary/40">Loading doctors...</p>
              </div>
            ) : doctors.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-secondary/40">
                  {debouncedSearch ? `No matches for "${debouncedSearch}"` : "No doctors found"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {doctors
                  .filter((doc) =>
                    sessionFilter
                      ? doc.sessions?.some((s) =>
                          s.title?.toLowerCase().includes(sessionFilter.toLowerCase())
                        )
                      : true
                  )
                  .map((doc) => (
                    <DoctorCard
                      key={doc.id}
                      doctor={doc}
                      isSelected={selectedDoctor?.id === doc.id}
                      isDisplayed={currentDisplay?.currentDoctorId === doc.id && currentDisplay?.currentView === "doctor"}
                      onSelect={handleSelectDoctor}
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Preview panel */}
          {selectedDoctor && (
            <div className="w-96 p-4 overflow-y-auto border-l border-surface-sunken">
              <DoctorPreview
                doctor={selectedDoctor}
                onDisplay={displayDoctor}
                isCurrentlyDisplayed={
                  currentDisplay?.currentDoctorId === selectedDoctor.id &&
                  currentDisplay?.currentView === "doctor"
                }
                onRefresh={() => {
                  fetchDoctors();
                  handleSelectDoctor(selectedDoctor);
                }}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/shared/Button";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);

  const createRoom = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/room/create", { method: "POST" });
      const { code } = await res.json();
      router.push(`/controller/${code}`);
    } catch {
      alert("Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const joinDisplay = () => {
    if (joinCode.trim().length >= 4) {
      router.push(`/display/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen brand-gradient flex items-center justify-center p-8">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <h1 className="text-display-title text-secondary mt-6">
            OSSAPCON 2026
          </h1>
          <p className="text-display-caption text-secondary/70 mt-2">
            Conference Display System
          </p>
          <p className="text-sm text-accent mt-1">
            February 20-22, 2026 • Kurnool Medical College
          </p>
        </div>

        {/* Create Room */}
        <div className="neu-card p-8 mb-6">
          <h2 className="text-xl font-bold text-secondary mb-2">
            🎛️ Controller Mode
          </h2>
          <p className="text-sm text-secondary/60 mb-4">
            Create a new room to control what displays on the big screen.
          </p>
          <Button
            variant="accent"
            size="lg"
            className="w-full"
            onClick={createRoom}
            disabled={creating}
          >
            {creating ? "Creating..." : "Create New Room"}
          </Button>
        </div>

        {/* Join Display */}
        <div className="neu-card p-8">
          <h2 className="text-xl font-bold text-secondary mb-2">
            🖥️ Display Mode
          </h2>
          <p className="text-sm text-secondary/60 mb-4">
            Enter a room code to connect this screen as a display.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Room Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="flex-1 px-4 py-3 rounded-neu-sm shadow-neu-pressed bg-surface text-secondary text-center text-xl font-mono tracking-widest outline-none focus:ring-2 focus:ring-primary uppercase"
              onKeyDown={(e) => e.key === "Enter" && joinDisplay()}
            />
            <Button
              variant="secondary"
              size="lg"
              onClick={joinDisplay}
              disabled={joinCode.trim().length < 4}
            >
              Join
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-secondary/30 mt-8">
          55th Annual Conference of the Orthopaedic Surgeons Society of Andhra
          Pradesh
        </p>
      </div>
    </div>
  );
}

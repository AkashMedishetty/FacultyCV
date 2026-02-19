"use client";
import { Logo } from "../shared/Logo";

export function IdleScreen() {
  return (
    <div className="min-h-screen brand-gradient flex flex-col items-center justify-center">
      <div className="neu-card p-16 text-center max-w-2xl animate-fade-in">
        <Logo size="lg" />
        <h1 className="text-display-title text-secondary mt-8">
          55th OSSAPCON 2026
        </h1>
        <p className="text-display-body text-secondary/70 mt-4">
          Annual Conference of the Orthopaedic Surgeons
          <br />
          Society of Andhra Pradesh
        </p>
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <p className="text-display-caption text-accent">
            February 20-22, 2026 • Kurnool Medical College
          </p>
        </div>
        <p className="text-sm text-secondary/40 mt-6">
          Waiting for content...
        </p>
      </div>
    </div>
  );
}

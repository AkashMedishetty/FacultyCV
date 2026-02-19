"use client";
import { useState } from "react";
import { Doctor } from "@/lib/types";
import { ProfilePhoto } from "../shared/ProfilePhoto";
import { Button } from "../shared/Button";

interface DoctorPreviewProps {
  doctor: Doctor;
  onDisplay: (doctorId: string) => void;
  isCurrentlyDisplayed?: boolean;
  onRefresh: () => void;
}

export function DoctorPreview({
  doctor,
  onDisplay,
  isCurrentlyDisplayed,
  onRefresh,
}: DoctorPreviewProps) {
  const [uploading, setUploading] = useState(false);
  const [showManualCV, setShowManualCV] = useState(false);
  const [manualCV, setManualCV] = useState({
    education: doctor.cvContent?.education || "",
    experience: doctor.cvContent?.experience || "",
    publications: doctor.cvContent?.publications || "",
    awards: doctor.cvContent?.awards || "",
  });
  const [savingManual, setSavingManual] = useState(false);

  const handleUpload = async (type: "photo" | "cv", file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/doctors/${doctor.id}/${type}`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        // Small delay to let blob propagate
        setTimeout(() => onRefresh(), 500);
      } else {
        const err = await res.json();
        alert(err.error || "Upload failed");
      }
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleManualSave = async () => {
    setSavingManual(true);
    try {
      const res = await fetch(`/api/doctors/${doctor.id}/cv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualCV),
      });
      if (res.ok) {
        setShowManualCV(false);
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.error || "Save failed");
      }
    } catch {
      alert("Save failed");
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <div className="neu-card p-6 animate-slide-in-right">
      <div className="flex items-start gap-4 mb-4">
        <ProfilePhoto src={doctor.profilePhotoUrl} name={doctor.name} size="lg" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-secondary">{doctor.name}</h2>
          {doctor.qualification && (
            <p className="text-sm text-accent font-medium mt-1">{doctor.qualification}</p>
          )}
          {doctor.designation && (
            <p className="text-sm text-secondary/70">{doctor.designation}</p>
          )}
          {doctor.institution && (
            <p className="text-sm text-secondary/60">{doctor.institution}</p>
          )}
        </div>
      </div>

      {/* Sessions */}
      {doctor.sessions?.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-secondary/80 mb-2">Sessions</h3>
          <div className="space-y-2">
            {doctor.sessions.map((s) => (
              <div key={s.id} className="neu-pressed p-2 text-sm">
                <p className="font-medium text-secondary">{s.title}</p>
                <p className="text-xs text-secondary/60">
                  {s.sessionDate} {s.sessionTime} • {s.venue}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo upload */}
      <div className="mb-3">
        <label className="block">
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload("photo", file);
            }}
            disabled={uploading}
          />
          <div className="neu-button text-center py-2 text-sm cursor-pointer hover:bg-primary/5">
            {uploading ? "Uploading..." : `📷 ${doctor.hasPhoto ? "Replace" : "Upload"} Photo`}
          </div>
        </label>
      </div>

      {/* CV section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-secondary/80">CV / Bio</h3>
          <div className="flex gap-1">
            <button
              onClick={() => setShowManualCV(!showManualCV)}
              className={`text-xs px-2 py-1 rounded ${
                showManualCV ? "bg-accent text-white" : "text-accent hover:bg-accent/10"
              }`}
            >
              ✏️ Manual
            </button>
          </div>
        </div>

        {showManualCV ? (
          <div className="space-y-3">
            {(["education", "experience", "publications", "awards"] as const).map((field) => (
              <div key={field}>
                <label className="text-xs font-semibold text-secondary/60 uppercase tracking-wider">
                  {field}
                </label>
                <textarea
                  value={manualCV[field]}
                  onChange={(e) => setManualCV({ ...manualCV, [field]: e.target.value })}
                  rows={3}
                  className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg border border-surface-sunken bg-surface text-secondary outline-none focus:ring-2 focus:ring-primary resize-y"
                  placeholder={`Enter ${field}...`}
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button
                variant="accent"
                size="sm"
                className="flex-1"
                onClick={handleManualSave}
                disabled={savingManual}
              >
                {savingManual ? "Saving..." : "💾 Save CV"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManualCV(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <label className="block mb-2">
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload("cv", file);
                }}
                disabled={uploading}
              />
              <div className="neu-button text-center py-2 text-sm cursor-pointer hover:bg-primary/5">
                {uploading ? "Uploading..." : `📄 ${doctor.hasCv ? "Replace" : "Upload"} CV File`}
              </div>
            </label>

            {doctor.cvContent?.rawText && (
              <div className="neu-pressed p-3 max-h-40 overflow-y-auto text-xs text-secondary/70 whitespace-pre-line">
                {doctor.cvContent.rawText.substring(0, 500)}
                {doctor.cvContent.rawText.length > 500 && "..."}
              </div>
            )}
          </>
        )}
      </div>

      {/* Display button */}
      {isCurrentlyDisplayed ? (
        <div className="w-full py-3 text-center rounded-lg bg-green-500 text-white font-semibold flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Currently Displayed on Screen
        </div>
      ) : (
        <Button variant="accent" size="lg" className="w-full" onClick={() => onDisplay(doctor.id)}>
          🖥️ Display on Screen
        </Button>
      )}
    </div>
  );
}

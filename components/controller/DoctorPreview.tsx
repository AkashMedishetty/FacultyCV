"use client";
import { useState } from "react";
import { Doctor } from "@/lib/types";
import { ProfilePhoto } from "../shared/ProfilePhoto";
import { Button } from "../shared/Button";

interface DoctorPreviewProps {
  doctor: Doctor;
  onDisplay: (doctorId: string) => void;
  onRefresh: () => void;
}

export function DoctorPreview({
  doctor,
  onDisplay,
  onRefresh,
}: DoctorPreviewProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (
    type: "photo" | "cv",
    file: File
  ) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/doctors/${doctor.id}/${type}`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        onRefresh();
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

  return (
    <div className="neu-card p-6 animate-slide-in-right">
      <div className="flex items-start gap-4 mb-4">
        <ProfilePhoto
          src={doctor.profilePhotoUrl}
          name={doctor.name}
          size="lg"
        />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-secondary">{doctor.name}</h2>
          {doctor.qualification && (
            <p className="text-sm text-accent font-medium mt-1">
              {doctor.qualification}
            </p>
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
          <h3 className="text-sm font-semibold text-secondary/80 mb-2">
            Sessions
          </h3>
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

      {/* Upload buttons */}
      <div className="flex gap-2 mb-4">
        <label className="flex-1">
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
          <div className="neu-button text-center py-2 text-sm">
            {uploading ? "Uploading..." : "📷 Upload Photo"}
          </div>
        </label>
        <label className="flex-1">
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
          <div className="neu-button text-center py-2 text-sm">
            {uploading ? "Uploading..." : "📄 Upload CV"}
          </div>
        </label>
      </div>

      {/* CV preview */}
      {doctor.cvContent?.rawText && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-secondary/80 mb-2">
            CV Preview
          </h3>
          <div className="neu-pressed p-3 max-h-40 overflow-y-auto text-xs text-secondary/70 whitespace-pre-line">
            {doctor.cvContent.rawText.substring(0, 500)}
            {doctor.cvContent.rawText.length > 500 && "..."}
          </div>
        </div>
      )}

      {/* Display button */}
      <Button
        variant="accent"
        size="lg"
        className="w-full"
        onClick={() => onDisplay(doctor.id)}
      >
        🖥️ Display on Screen
      </Button>
    </div>
  );
}

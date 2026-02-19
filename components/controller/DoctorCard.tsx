"use client";
import { Doctor } from "@/lib/types";
import { ProfilePhoto } from "../shared/ProfilePhoto";

interface DoctorCardProps {
  doctor: Doctor;
  isSelected: boolean;
  onSelect: (doctor: Doctor) => void;
}

export function DoctorCard({ doctor, isSelected, onSelect }: DoctorCardProps) {
  return (
    <div
      onClick={() => onSelect(doctor)}
      className={`p-3 rounded-neu-sm cursor-pointer transition-all duration-200 ${
        isSelected
          ? "bg-primary/20 shadow-neu-pressed border-2 border-primary"
          : "bg-surface-raised shadow-neu-raised-sm hover:shadow-neu-button-hover border-2 border-transparent"
      }`}
    >
      <div className="flex items-center gap-3">
        <ProfilePhoto
          src={doctor.profilePhotoUrl}
          name={doctor.name}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-secondary text-sm truncate">
            {doctor.name}
          </p>
          <p className="text-xs text-secondary/60 truncate">
            {doctor.institution || "No institution"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {doctor.sessions?.length > 0 && (
              <span className="text-xs bg-primary/20 text-secondary px-2 py-0.5 rounded-full">
                {doctor.sessions.length} session
                {doctor.sessions.length > 1 ? "s" : ""}
              </span>
            )}
            {!doctor.hasPhoto && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                No photo
              </span>
            )}
            {!doctor.hasCv && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                No CV
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

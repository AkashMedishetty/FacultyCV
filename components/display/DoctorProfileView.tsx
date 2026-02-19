"use client";
import { Doctor } from "@/lib/types";
import { ProfilePhoto } from "../shared/ProfilePhoto";
import { Logo } from "../shared/Logo";

interface DoctorProfileViewProps {
  doctor: Doctor;
}

export function DoctorProfileView({ doctor }: DoctorProfileViewProps) {
  const currentSession = doctor.sessions?.[0];

  return (
    <div className="min-h-screen brand-gradient p-8 animate-fade-in">
      {/* Header with branding */}
      <div className="flex items-center justify-between mb-6">
        <Logo size="sm" />
        <div className="text-right">
          <p className="text-sm text-secondary/60 font-medium">
            55th OSSAPCON 2026
          </p>
        </div>
      </div>

      <div className="flex gap-8 h-[calc(100vh-140px)]">
        {/* Left: Photo and basic info */}
        <div className="w-1/3 flex flex-col items-center">
          <div className="neu-card p-8 text-center w-full">
            <div className="flex justify-center mb-6">
              <ProfilePhoto
                src={doctor.profilePhotoUrl}
                name={doctor.name}
                size="display"
              />
            </div>
            <h1 className="text-display-title text-secondary">
              {doctor.name}
            </h1>
            {doctor.qualification && (
              <p className="text-display-caption text-accent mt-2 font-medium">
                {doctor.qualification}
              </p>
            )}
            {doctor.designation && (
              <p className="text-display-body text-secondary/70 mt-1">
                {doctor.designation}
              </p>
            )}
            {doctor.institution && (
              <p className="text-display-caption text-secondary/60 mt-1">
                {doctor.institution}
              </p>
            )}

            {/* Current session badge */}
            {currentSession && (
              <div className="mt-6 neu-pressed p-4">
                <p className="text-xs text-accent font-semibold uppercase tracking-wider">
                  Session
                </p>
                <p className="text-lg text-secondary font-semibold mt-1">
                  {currentSession.title}
                </p>
                <div className="flex items-center justify-center gap-3 mt-2 text-sm text-secondary/60">
                  {currentSession.sessionTime && (
                    <span>🕐 {currentSession.sessionTime}</span>
                  )}
                  {currentSession.venue && (
                    <span>📍 {currentSession.venue}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: CV Content */}
        <div className="w-2/3 overflow-y-auto">
          <div className="neu-card p-8">
            {doctor.cvContent ? (
              <div className="space-y-6">
                {doctor.cvContent.education && (
                  <CVSection
                    title="Education & Qualifications"
                    content={doctor.cvContent.education}
                    icon="🎓"
                  />
                )}
                {doctor.cvContent.experience && (
                  <CVSection
                    title="Experience"
                    content={doctor.cvContent.experience}
                    icon="💼"
                  />
                )}
                {doctor.cvContent.publications && (
                  <CVSection
                    title="Publications"
                    content={doctor.cvContent.publications}
                    icon="📄"
                  />
                )}
                {doctor.cvContent.awards && (
                  <CVSection
                    title="Awards & Achievements"
                    content={doctor.cvContent.awards}
                    icon="🏆"
                  />
                )}
                {doctor.cvContent.otherContent && (
                  <CVSection
                    title="Additional Information"
                    content={doctor.cvContent.otherContent}
                    icon="📋"
                  />
                )}
                {!doctor.cvContent.education &&
                  !doctor.cvContent.experience &&
                  !doctor.cvContent.publications &&
                  !doctor.cvContent.awards &&
                  doctor.cvContent.rawText && (
                    <CVSection
                      title="Curriculum Vitae"
                      content={doctor.cvContent.rawText}
                      icon="📋"
                    />
                  )}
              </div>
            ) : doctor.publications ? (
              <CVSection
                title="Publications"
                content={doctor.publications}
                icon="📄"
              />
            ) : (
              <div className="text-center py-16 text-secondary/40">
                <p className="text-2xl">No CV content available</p>
              </div>
            )}

            {/* Session outline */}
            {currentSession?.outline && (
              <div className="mt-6 pt-6 border-t border-surface-sunken">
                <h3 className="text-xl font-semibold text-accent mb-3">
                  Session Outline
                </h3>
                <p className="text-display-caption text-secondary/80 leading-relaxed">
                  {currentSession.outline}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CVSection({
  title,
  content,
  icon,
}: {
  title: string;
  content: string;
  icon: string;
}) {
  return (
    <div className="animate-slide-up">
      <h3 className="text-xl font-semibold text-secondary flex items-center gap-2 mb-3">
        <span>{icon}</span> {title}
      </h3>
      <div className="neu-pressed p-4">
        <p className="text-base text-secondary/80 leading-relaxed whitespace-pre-line">
          {content}
        </p>
      </div>
    </div>
  );
}

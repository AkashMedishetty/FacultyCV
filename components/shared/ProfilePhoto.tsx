"use client";
import Image from "next/image";

interface ProfilePhotoProps {
  src: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "display";
}

export function ProfilePhoto({ src, name, size = "md" }: ProfilePhotoProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-24 h-24",
    lg: "w-40 h-40",
    display: "w-64 h-64",
  };

  const initials = name
    .split(" ")
    .filter((w) => w.length > 1)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={`${sizeClasses[size]} rounded-full shadow-neu-raised overflow-hidden flex-shrink-0 border-4 border-surface-raised`}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={size === "display" ? 256 : size === "lg" ? 160 : size === "md" ? 96 : 48}
          height={size === "display" ? 256 : size === "lg" ? 160 : size === "md" ? 96 : 48}
          className="w-full h-full object-cover"
          unoptimized
        />
      ) : (
        <div className="w-full h-full bg-primary-light flex items-center justify-center">
          <span
            className={`font-bold text-secondary ${
              size === "display"
                ? "text-6xl"
                : size === "lg"
                ? "text-4xl"
                : size === "md"
                ? "text-2xl"
                : "text-sm"
            }`}
          >
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}

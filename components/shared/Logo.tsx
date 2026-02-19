"use client";
import Image from "next/image";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: 40, md: 80, lg: 120 };
  const h = sizes[size];

  return (
    <div className="flex items-center gap-4">
      <Image
        src="/logos/OSSAPCON2026 LOGO.png"
        alt="OSSAPCON 2026"
        width={h * 2}
        height={h}
        className="object-contain"
        priority
      />
    </div>
  );
}

"use client";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  variant?: "raised" | "pressed" | "flat";
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  variant = "raised",
  className = "",
  onClick,
}: CardProps) {
  const variants = {
    raised: "neu-card",
    pressed: "neu-pressed",
    flat: "bg-surface-raised rounded-neu-sm",
  };

  return (
    <div
      className={`${variants[variant]} p-4 ${className} ${
        onClick ? "cursor-pointer hover:scale-[1.01] transition-transform" : ""
      }`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

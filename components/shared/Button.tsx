"use client";
import { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "accent" | "ghost" | "secondary";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-primary text-secondary hover:bg-primary-dark shadow-neu-button hover:shadow-neu-button-hover",
    accent:
      "bg-accent text-white hover:bg-accent-dark shadow-neu-button hover:shadow-neu-button-hover",
    secondary:
      "bg-secondary text-white hover:bg-secondary-light shadow-neu-button",
    ghost:
      "bg-transparent text-secondary hover:bg-surface-sunken",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-5 py-2.5 text-base rounded-neu-sm",
    lg: "px-8 py-3.5 text-lg rounded-neu-sm",
  };

  return (
    <button
      className={`${variants[variant]} ${sizes[size]} font-medium transition-all duration-200 active:shadow-neu-pressed disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

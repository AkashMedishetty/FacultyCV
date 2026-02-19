import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8fb1e7",
          light: "#b8d4f5",
          lighter: "#e3eef9",
          dark: "#6a94d4",
        },
        secondary: {
          DEFAULT: "#00224d",
          light: "#1a3d6b",
          lighter: "#2d5a8a",
        },
        accent: {
          DEFAULT: "#b99b64",
          light: "#d4c4a8",
          lighter: "#efe6d8",
          dark: "#9a7d4a",
        },
        surface: {
          DEFAULT: "#f0f4f8",
          raised: "#ffffff",
          sunken: "#e4e9ef",
        },
      },
      boxShadow: {
        "neu-raised":
          "8px 8px 16px rgba(0, 34, 77, 0.08), -8px -8px 16px rgba(255, 255, 255, 0.9)",
        "neu-raised-sm":
          "4px 4px 8px rgba(0, 34, 77, 0.08), -4px -4px 8px rgba(255, 255, 255, 0.9)",
        "neu-pressed":
          "inset 4px 4px 8px rgba(0, 34, 77, 0.08), inset -4px -4px 8px rgba(255, 255, 255, 0.9)",
        "neu-button":
          "5px 5px 10px rgba(0, 34, 77, 0.1), -5px -5px 10px rgba(255, 255, 255, 0.9)",
        "neu-button-hover":
          "3px 3px 6px rgba(0, 34, 77, 0.12), -3px -3px 6px rgba(255, 255, 255, 0.9)",
      },
      borderRadius: {
        neu: "20px",
        "neu-sm": "12px",
        "neu-lg": "28px",
      },
      fontSize: {
        "display-name": ["4rem", { lineHeight: "1.1", fontWeight: "700" }],
        "display-title": ["2.5rem", { lineHeight: "1.2", fontWeight: "600" }],
        "display-body": ["1.5rem", { lineHeight: "1.6", fontWeight: "400" }],
        "display-caption": ["1.25rem", { lineHeight: "1.5", fontWeight: "400" }],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

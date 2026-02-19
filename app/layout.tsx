import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OSSAPCON 2026 - Conference Display System",
  description:
    "55th Annual Conference of the Orthopaedic Surgeons Society of Andhra Pradesh - Real-time Display System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

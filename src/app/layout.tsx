import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google";
import "./globals.css";

const display = Orbitron({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700", "800", "900"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "LaserGame FaceClub",
  description: "Rezervačný systém pre LaserGame eventy vo FaceClube."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <body className={`${display.variable} ${body.variable} font-body bg-bg text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}

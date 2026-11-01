import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PathFinder AI – Career guidance built around you",
  description:
    "AI-based career guidance for undergraduate students. Discover careers that fit your skills, interests and academic background.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}

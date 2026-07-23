import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics — Incident Statistics",
  description:
    "Incident category breakdown, severity by zone, and resolution rates across the stadium.",
  alternates: { canonical: "/stats" },
  // Internal analytics surface — do not index or rank in search results.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

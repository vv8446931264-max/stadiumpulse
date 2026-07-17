import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics — Incident Statistics | StadiumPulse",
  description:
    "Incident category breakdown, severity by zone, and resolution rates across the stadium.",
  alternates: { canonical: "/stats" },
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

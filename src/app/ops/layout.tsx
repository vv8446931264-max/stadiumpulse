import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ops Command — Live Incident Queue",
  description:
    "Real-time prioritized incident queue and live stadium heat map for venue staff at FIFA World Cup 2026.",
  alternates: { canonical: "/ops" },
};

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

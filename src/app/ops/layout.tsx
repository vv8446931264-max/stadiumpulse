import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ops Command — Live Incident Queue",
  description:
    "Real-time prioritized incident queue and live stadium heat map for venue staff at FIFA World Cup 2026.",
  alternates: { canonical: "/ops" },
  // Internal operations surface — do not index or rank in search results.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

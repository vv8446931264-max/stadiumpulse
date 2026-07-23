import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "StadiumPulse — GenAI Incident Triage for FIFA World Cup 2026",
  description:
    "Report stadium incidents in any language. Gemini AI triages them into structured, prioritized ops intelligence in seconds.",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "FIFA World Cup 2026",
    "stadium operations",
    "GenAI",
    "incident triage",
    "Gemini",
    "crowd management",
    "multilingual",
  ],
  openGraph: {
    title: "StadiumPulse — GenAI Incident Triage",
    description:
      "Report in any language. AI triages. Code calculates priority. Ops team responds.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StadiumPulse — GenAI Incident Triage",
    description:
      "Report in any language. AI triages. Code calculates priority.",
    images: ["/og-image.png"],
  },
  icons: { icon: "/icon.png" },
};

/** Static, compile-time structured data — no user input flows here. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "StadiumPulse",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "GenAI incident triage for FIFA World Cup 2026 stadium operations. Report in any language; AI parses, code calculates priority.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0B1220] text-[#E6EDF7]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#22D3EE] focus:text-[#0B1220] focus:rounded focus:font-semibold"
        >
          Skip to main content
        </a>
        <header>
          <Navbar />
        </header>
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-[#1e293b] py-4 text-center text-xs text-[#93A4BF]">
          Built with{" "}
          <span className="text-[#22D3EE]">Google Antigravity</span> +{" "}
          <span className="text-[#22D3EE]">Gemini</span> for PromptWars
          Challenge 4
        </footer>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}

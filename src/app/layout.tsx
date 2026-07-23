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
  title: {
    default:
      "StadiumPulse — GenAI Incident Triage for FIFA World Cup 2026 Stadium Operations",
    template: "%s | StadiumPulse",
  },
  description:
    "Fans report stadium incidents in any language — typed or spoken. Gemini 2.5 Flash triages each report in seconds; deterministic code ranks priority and lights up a live SVG stadium heat map. Built for FIFA World Cup 2026 crowd management, accessibility, transport, sustainability, and multilingual operations.",
  applicationName: "StadiumPulse",
  authors: [{ name: "Vivek Vishwakarma" }],
  creator: "Vivek Vishwakarma",
  alternates: { canonical: "/" },
  category: "technology",
  openGraph: {
    title: "StadiumPulse — GenAI Incident Triage for FIFA World Cup 2026",
    description:
      "Report in any language. AI parses. Code calculates priority. Ops responds in seconds — with a live stadium heat map and a wayfinding assistant.",
    url: "/",
    siteName: "StadiumPulse",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "StadiumPulse — GenAI incident triage for FIFA World Cup 2026",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StadiumPulse — GenAI Incident Triage",
    description:
      "Report in any language. AI parses. Code calculates priority.",
    images: ["/og.jpg"],
  },
  icons: { icon: "/icon.png", apple: "/logo.png" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/** Static, compile-time structured data — no user input flows here. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "StadiumPulse",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Stadium Operations",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "GenAI incident triage for FIFA World Cup 2026 stadium operations. Fans report in any language (typed or spoken); Gemini 2.5 Flash parses, deterministic code prioritizes, and a live stadium heat map guides ops staff.",
  featureList: [
    "Multilingual voice + text incident reporting",
    "AI-powered triage with confidence scoring",
    "Live SVG stadium heat map",
    "Wayfinding assistant for fans",
    "Deterministic priority scoring",
    "Self-correcting AI pipeline with Zod validation",
  ],
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", name: "Vivek Vishwakarma" },
  softwareVersion: "0.1.0",
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

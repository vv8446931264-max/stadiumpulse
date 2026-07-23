"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Report" },
  { href: "/ops", label: "Ops Command" },
  { href: "/stats", label: "Analytics" },
] as const;

/**
 * Shared navigation bar for all pages.
 * Highlights the active page and provides keyboard-accessible navigation.
 */
export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="bg-[#121A2B] border-b border-[#1e293b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-[#E6EDF7] hover:text-[#22D3EE] transition-colors"
            aria-label="StadiumPulse home"
          >
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="rounded"
              aria-hidden="true"
            />
            <span>
              <span className="text-[#22D3EE]">Stadium</span>Pulse
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-bold transition-all ${
                    isActive
                      ? "bg-[#22D3EE]/15 text-[#22D3EE] shadow-[0_0_8px_rgba(34,211,238,0.1)]"
                      : "text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#1e293b]"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

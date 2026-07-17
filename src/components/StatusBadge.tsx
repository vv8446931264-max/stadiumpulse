import type { Category, IncidentSource } from "@/lib/schema";
import { CATEGORY_LABELS } from "@/lib/schema";

/** Color mapping for categories. */
const CATEGORY_COLORS: Record<Category, string> = {
  medical: "bg-red-500/20 text-red-400 border-red-500/30",
  security: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  crowding: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  accessibility: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  lost_person: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  transport: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  facility: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  sustainability: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  other: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

/** Color mapping for severity levels. */
const SEVERITY_COLORS: Record<number, string> = {
  1: "text-green-400",
  2: "text-blue-400",
  3: "text-yellow-400",
  4: "text-orange-400",
  5: "text-red-400",
};

/**
 * Badge component for displaying category, severity, or source labels.
 */
export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_COLORS[category]}`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: number }) {
  const color = SEVERITY_COLORS[severity] ?? "text-gray-400";
  return (
    <span className={`text-xs font-bold ${color}`} aria-label={`Severity ${severity} of 5`}>
      SEV-{severity}
    </span>
  );
}

export function SourceBadge({ source }: { source: IncidentSource }) {
  if (source === "user") return null;
  const label = source === "seed" ? "demo" : "fallback";
  const color =
    source === "seed"
      ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
      : "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${color}`}>
      {label}
    </span>
  );
}

export function PriorityIndicator({ priority }: { priority: number }) {
  const color =
    priority >= 80
      ? "text-red-400 bg-red-500/20"
      : priority >= 60
        ? "text-orange-400 bg-orange-500/20"
        : priority >= 40
          ? "text-yellow-400 bg-yellow-500/20"
          : "text-green-400 bg-green-500/20";
  return (
    <div
      className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm ${color}`}
      aria-label={`Priority score ${priority}`}
    >
      {priority}
    </div>
  );
}

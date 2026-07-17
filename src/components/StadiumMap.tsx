"use client";

import type { ZoneHeatData } from "@/lib/engine";
import type { Zone, HeatLevel } from "@/lib/schema";
import { ZONE_LABELS } from "@/lib/schema";

/**
 * Top-down stadium schematic where each of the 8 zones lights up by heat level.
 * Uses the same ZoneHeatData the flat grid did — this is the visual upgrade.
 *
 * Bowl geometry: an annulus (outer→mid = 4 stands, mid→pitch = concourse ring)
 * centered on the pitch. Three facility zones sit outside the bowl as chips.
 */

const CENTER = { x: 220, y: 178 };
const OUTER = { rx: 140, ry: 112 };
const MID = { rx: 100, ry: 80 };
const PITCH = { rx: 62, ry: 47 };

/** Fill color + opacity ramp per heat level. */
const HEAT_FILL: Record<HeatLevel, { color: string; opacity: number }> = {
  calm: { color: "#34D399", opacity: 0.16 },
  busy: { color: "#F59E0B", opacity: 0.32 },
  high: { color: "#EF4444", opacity: 0.5 },
  critical: { color: "#EF4444", opacity: 0.72 },
};

const HEAT_STROKE: Record<HeatLevel, string> = {
  calm: "#34D399",
  busy: "#F59E0B",
  high: "#EF4444",
  critical: "#F87171",
};

/** Point on an ellipse at angle θ (degrees, 0=east, 90=south in screen space). */
function pt(rx: number, ry: number, deg: number) {
  const r = (deg * Math.PI) / 180;
  return { x: CENTER.x + rx * Math.cos(r), y: CENTER.y + ry * Math.sin(r) };
}

/** Annulus segment (a stand): outer arc θ1→θ2, inner arc back. */
function standPath(deg1: number, deg2: number): string {
  const o1 = pt(OUTER.rx, OUTER.ry, deg1);
  const o2 = pt(OUTER.rx, OUTER.ry, deg2);
  const m2 = pt(MID.rx, MID.ry, deg2);
  const m1 = pt(MID.rx, MID.ry, deg1);
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${OUTER.rx} ${OUTER.ry} 0 0 1 ${o2.x} ${o2.y}`,
    `L ${m2.x} ${m2.y}`,
    `A ${MID.rx} ${MID.ry} 0 0 0 ${m1.x} ${m1.y}`,
    "Z",
  ].join(" ");
}

/** Full ring between mid and pitch ellipses (the concourse), even-odd filled. */
function ringPath(): string {
  const { x, y } = CENTER;
  return [
    `M ${x - MID.rx} ${y}`,
    `A ${MID.rx} ${MID.ry} 0 1 0 ${x + MID.rx} ${y}`,
    `A ${MID.rx} ${MID.ry} 0 1 0 ${x - MID.rx} ${y}`,
    `M ${x - PITCH.rx} ${y}`,
    `A ${PITCH.rx} ${PITCH.ry} 0 1 1 ${x + PITCH.rx} ${y}`,
    `A ${PITCH.rx} ${PITCH.ry} 0 1 1 ${x - PITCH.rx} ${y}`,
    "Z",
  ].join(" ");
}

/** Centroid for a stand label (mid-angle, between outer and mid radius). */
function standLabel(deg1: number, deg2: number) {
  const mid = (deg1 + deg2) / 2;
  const r = 0.82;
  return pt((OUTER.rx + MID.rx) / 2 * r + 0, (OUTER.ry + MID.ry) / 2, mid);
}

type ZoneShape =
  | { kind: "stand"; deg1: number; deg2: number }
  | { kind: "ring" }
  | { kind: "rect"; x: number; y: number; w: number; h: number };

// East 0, South 90, West 180, North 270 — split stands at the diagonals.
const ZONE_SHAPES: Record<Zone, ZoneShape> = {
  east_stand: { kind: "stand", deg1: -45, deg2: 45 },
  south_gate: { kind: "stand", deg1: 45, deg2: 135 },
  west_stand: { kind: "stand", deg1: 135, deg2: 225 },
  north_gate: { kind: "stand", deg1: 225, deg2: 315 },
  concourse: { kind: "ring" },
  transit_hub: { kind: "rect", x: 8, y: 8, w: 118, h: 46 },
  parking: { kind: "rect", x: 314, y: 8, w: 118, h: 46 },
  fan_zone: { kind: "rect", x: 8, y: 316, w: 424, h: 40 },
};

export default function StadiumMap({
  heatData,
  selectedZone = null,
  onZoneSelect,
}: {
  heatData: ZoneHeatData[];
  selectedZone?: Zone | null;
  onZoneSelect?: (zone: Zone | null) => void;
}) {
  const byZone = new Map(heatData.map((d) => [d.zone, d]));

  function cell(zone: Zone) {
    const data = byZone.get(zone);
    const level: HeatLevel = data?.level ?? "calm";
    const count = data?.openCount ?? 0;
    const fill = HEAT_FILL[level];
    const label = ZONE_LABELS[zone];
    const shape = ZONE_SHAPES[zone];
    const isHot = level === "high" || level === "critical";
    const isSelected = selectedZone === zone;
    const toggle = () => onZoneSelect?.(isSelected ? null : zone);

    // Label anchor per shape.
    let lx = CENTER.x;
    let ly = CENTER.y;
    if (shape.kind === "stand") {
      const p = standLabel(shape.deg1, shape.deg2);
      lx = p.x;
      ly = p.y;
    } else if (shape.kind === "ring") {
      lx = CENTER.x;
      ly = CENTER.y - (PITCH.ry + MID.ry) / 2;
    } else {
      lx = shape.x + shape.w / 2;
      ly = shape.y + shape.h / 2;
    }

    const common = {
      fill: fill.color,
      fillOpacity: fill.opacity,
      stroke: HEAT_STROKE[level],
      strokeOpacity: isSelected ? 1 : 0.55,
      strokeWidth: isSelected ? 2.5 : 1.2,
      style: isHot
        ? { animation: "zone-pulse 1.8s ease-in-out infinite" }
        : undefined,
    };

    return (
      <g
        key={zone}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`${label}: ${level}, ${count} open incidents. ${
          isSelected
            ? "Selected — activate to clear the filter."
            : "Activate to filter the queue."
        }`}
        className="cursor-pointer"
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        {shape.kind === "stand" && (
          <path d={standPath(shape.deg1, shape.deg2)} {...common} />
        )}
        {shape.kind === "ring" && (
          <path d={ringPath()} fillRule="evenodd" {...common} />
        )}
        {shape.kind === "rect" && (
          <rect
            x={shape.x}
            y={shape.y}
            width={shape.w}
            height={shape.h}
            rx={8}
            {...common}
          />
        )}
        <text
          x={lx}
          y={ly - 3}
          textAnchor="middle"
          className="fill-[#E6EDF7] text-[10px] font-semibold"
          style={{ pointerEvents: "none" }}
        >
          {label}
        </text>
        <text
          x={lx}
          y={ly + 9}
          textAnchor="middle"
          className="text-[9px] font-bold uppercase tracking-wide"
          fill={HEAT_STROKE[level]}
          style={{ pointerEvents: "none" }}
        >
          {level} · {count}
        </text>
      </g>
    );
  }

  return (
    <div>
      <svg
        viewBox="0 0 440 360"
        className="w-full h-auto"
        role="group"
        aria-label="Live stadium zone heat map"
      >
        {/* Bowl backdrop */}
        <ellipse
          cx={CENTER.x}
          cy={CENTER.y}
          rx={OUTER.rx + 4}
          ry={OUTER.ry + 4}
          fill="#0B1220"
          stroke="#1e293b"
          strokeWidth={1.5}
        />

        {/* Zones (stands + concourse + facilities) */}
        {(Object.keys(ZONE_SHAPES) as Zone[]).map(cell)}

        {/* Pitch */}
        <ellipse
          cx={CENTER.x}
          cy={CENTER.y}
          rx={PITCH.rx}
          ry={PITCH.ry}
          fill="#0f2a1a"
          stroke="#1f6f43"
          strokeWidth={1.5}
        />
        <line
          x1={CENTER.x}
          y1={CENTER.y - PITCH.ry}
          x2={CENTER.x}
          y2={CENTER.y + PITCH.ry}
          stroke="#1f6f43"
          strokeWidth={1}
          strokeOpacity={0.7}
        />
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={12}
          fill="none"
          stroke="#1f6f43"
          strokeWidth={1}
          strokeOpacity={0.7}
        />
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-[#93A4BF]">
        {(Object.keys(HEAT_FILL) as HeatLevel[]).map((lvl) => (
          <span key={lvl} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{
                backgroundColor: HEAT_FILL[lvl].color,
                opacity: Math.max(0.35, HEAT_FILL[lvl].opacity),
              }}
            />
            <span className="capitalize">{lvl}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

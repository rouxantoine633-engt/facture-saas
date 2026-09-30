"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
import { display } from "@/lib/fonts";
import type { MonthlyRevenuePoint } from "@/lib/analytics";

const EASE = [0.22, 1, 0.36, 1] as const;
const ACCENT = "#8b7cff";
const SURFACE = "#0b0b0f";

const W = 640;
const H = 220;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 8;

function formatCompactEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    cents / 100
  );
}

export function RevenueChart({ series }: { series: MonthlyRevenuePoint[] }) {
  const gradientId = useId();
  const [hovered, setHovered] = useState<number | null>(null);

  const max = Math.max(1, ...series.map((p) => p.totalCents));
  const plotWidth = W - PAD_LEFT - PAD_RIGHT;
  const plotHeight = H - PAD_TOP - PAD_BOTTOM;
  const stepX = series.length > 1 ? plotWidth / (series.length - 1) : 0;

  const points = series.map((p, i) => ({
    ...p,
    x: PAD_LEFT + i * stepX,
    y: PAD_TOP + plotHeight * (1 - p.totalCents / max),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${PAD_TOP + plotHeight} L ${points[0]?.x ?? 0} ${
    PAD_TOP + plotHeight
  } Z`;

  const activeIndex = hovered ?? points.length - 1;
  const active = points[activeIndex];
  const gridLines = [0, 0.5, 1];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        role="img"
        aria-label={`Chiffre d'affaires encaissé des ${series.length} derniers mois`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.22" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((g) => {
          const y = PAD_TOP + plotHeight * (1 - g);
          return (
            <g key={g}>
              <line x1={PAD_LEFT} y1={y} x2={W - PAD_RIGHT} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
              <text x={PAD_LEFT} y={y - 4} fontSize={9} fill="rgba(255,255,255,0.3)">
                {formatCompactEuros(Math.round(max * g))}
              </text>
            </g>
          );
        })}

        <motion.path
          d={areaPath}
          fill={`url(#${gradientId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke={ACCENT}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: EASE }}
        />

        {active && (
          <line
            x1={active.x}
            y1={PAD_TOP}
            x2={active.x}
            y2={PAD_TOP + plotHeight}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
          />
        )}

        {points.map((p, i) => (
          <g key={p.monthKey}>
            {i === activeIndex && (
              <circle cx={p.x} cy={p.y} r={5} fill={ACCENT} stroke={SURFACE} strokeWidth={2} />
            )}
            {/* Cible de survol/focus généreuse (>=24px) centrée sur le point du mois. */}
            <rect
              x={p.x - stepX / 2}
              y={PAD_TOP}
              width={stepX || plotWidth}
              height={plotHeight}
              fill="transparent"
              tabIndex={0}
              role="img"
              aria-label={`${p.label} : ${formatCompactEuros(p.totalCents)}`}
              onPointerEnter={() => setHovered(i)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
            />
          </g>
        ))}
      </svg>

      <div className="mt-1 flex justify-between px-1 text-xs text-white/40">
        {series.map((p, i) => (
          <span key={p.monthKey} className={i === activeIndex ? "font-medium text-white/70" : undefined}>
            {p.label}
          </span>
        ))}
      </div>

      {active && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-white/10 bg-[#0b0b0f] px-3 py-2 shadow-lg"
          style={{
            left: `${(active.x / W) * 100}%`,
            top: `${Math.max(0, (active.y / H) * 100 - 18)}%`,
          }}
        >
          <p className="text-xs text-white/50">{active.label}</p>
          <p className={`${display.className} text-sm font-semibold text-white`}>
            {formatCompactEuros(active.totalCents)}
          </p>
        </div>
      )}

      <table className="sr-only">
        <caption>Chiffre d&apos;affaires encaissé par mois</caption>
        <thead>
          <tr>
            <th scope="col">Mois</th>
            <th scope="col">Montant encaissé</th>
          </tr>
        </thead>
        <tbody>
          {series.map((p) => (
            <tr key={p.monthKey}>
              <td>{p.label}</td>
              <td>{formatCompactEuros(p.totalCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { display } from "@/lib/fonts";

const EASE = [0.22, 1, 0.36, 1] as const;

export interface KpiItem {
  label: string;
  value: string;
  deltaLabel?: string;
  deltaTone?: "good" | "bad" | "neutral";
  href?: string;
}

export function DashboardKpis({ items }: { items: KpiItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((kpi, i) => (
        <Tile key={kpi.label} kpi={kpi} index={i} />
      ))}
    </div>
  );
}

function Tile({ kpi, index }: { kpi: KpiItem; index: number }) {
  const body = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: EASE }}
      className={`h-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 ${
        kpi.href ? "transition-colors hover:border-white/20" : ""
      }`}
    >
      <p className="text-sm text-white/50">{kpi.label}</p>
      <p className={`${display.className} mt-2 text-3xl font-semibold text-white`}>{kpi.value}</p>
      {kpi.deltaLabel && (
        <p
          className={`mt-1 text-xs font-medium ${
            kpi.deltaTone === "good"
              ? "text-emerald-400"
              : kpi.deltaTone === "bad"
                ? "text-red-400"
                : "text-white/40"
          }`}
        >
          {kpi.deltaLabel}
        </p>
      )}
    </motion.div>
  );

  return kpi.href ? (
    <Link href={kpi.href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

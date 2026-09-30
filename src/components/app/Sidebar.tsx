"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  Building2,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Home,
  LayoutDashboard,
  Menu,
  Receipt,
  RotateCcw,
  Scale,
  Settings,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

type IconType = ComponentType<{ className?: string }>;

interface NavLink {
  kind: "link";
  label: string;
  href: string;
  icon: IconType;
}

interface NavDisabled {
  kind: "disabled";
  label: string;
  icon: IconType;
  badge: string;
}

type NavItem = NavLink | NavDisabled;

interface NavGroup {
  kind: "group";
  label: string;
  icon: IconType;
  items: NavItem[];
}

interface NavStatic {
  kind: "static";
  label: string;
  icon: IconType;
  items: NavItem[];
}

interface NavFlat {
  kind: "flat";
  label: string;
  href: string;
  icon: IconType;
}

type NavSection = NavGroup | NavStatic | NavFlat;

const NAV: NavSection[] = [
  {
    kind: "group",
    label: "Pilotage",
    icon: LayoutDashboard,
    items: [
      { kind: "link", label: "Tableau de bord", href: "/app/tableau-de-bord", icon: Home },
      { kind: "disabled", label: "Trésorerie", icon: Wallet, badge: "Bientôt" },
    ],
  },
  {
    kind: "group",
    label: "Commercial",
    icon: Briefcase,
    items: [
      { kind: "link", label: "Devis", href: "/app/devis", icon: FileText },
      { kind: "link", label: "Factures", href: "/app/factures", icon: Receipt },
      { kind: "link", label: "Avoirs", href: "/app/avoirs", icon: RotateCcw },
    ],
  },
  { kind: "flat", label: "Clients", href: "/app/clients", icon: Users },
  {
    kind: "static",
    label: "Comptabilité & Légal",
    icon: Scale,
    items: [{ kind: "link", label: "Export comptable", href: "/app/export", icon: FileSpreadsheet }],
  },
  {
    kind: "static",
    label: "Paramètres",
    icon: Settings,
    items: [
      { kind: "link", label: "Mon entreprise", href: "/app/entreprise/configuration", icon: Building2 },
      { kind: "link", label: "Mes données", href: "/app/compte", icon: UserCog },
    ],
  },
];

function groupContainsPath(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => item.kind === "link" && pathname.startsWith(item.href));
}

function ItemRow({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  if (item.kind === "disabled") {
    return (
      <div className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/25">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/30">
          {item.badge}
        </span>
      </div>
    );
  }
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? "bg-white/10 font-medium text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function GroupSection({ group, pathname }: { group: NavGroup; pathname: string }) {
  const containsActive = groupContainsPath(group, pathname);
  const [open, setOpen] = useState(containsActive);
  const Icon = group.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="ml-2 mt-1 space-y-0.5 border-l border-white/10 pl-3">
              {group.items.map((item) => (
                <ItemRow
                  key={item.label}
                  item={item}
                  active={item.kind === "link" && pathname.startsWith(item.href)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StaticSection({ section, pathname }: { section: NavStatic; pathname: string }) {
  const Icon = section.icon;
  return (
    <div>
      <p className="flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-white/30">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {section.label}
      </p>
      <div className="mt-1 space-y-0.5">
        {section.items.map((item) => (
          <ItemRow key={item.label} item={item} active={item.kind === "link" && pathname.startsWith(item.href)} />
        ))}
      </div>
    </div>
  );
}

function NavContent({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Navigation principale" className="flex flex-col gap-4">
      {NAV.map((section) => {
        if (section.kind === "group") return <GroupSection key={section.label} group={section} pathname={pathname} />;
        if (section.kind === "static") return <StaticSection key={section.label} section={section} pathname={pathname} />;
        const Icon = section.icon;
        const active = pathname.startsWith(section.href);
        return (
          <Link
            key={section.label}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:bg-white focus:p-2">
        Aller au contenu
      </a>

      {/* Barre mobile : logo + bouton menu, visible uniquement en dessous de sm */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#07070a] px-4 py-3 sm:hidden">
        <span className="text-sm font-semibold tracking-tight text-white">Onyx</span>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Sidebar fixe desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#07070a] px-3 py-6 sm:block">
        <div className="px-3 pb-6">
          <span className="text-sm font-semibold tracking-tight text-white">Onyx</span>
        </div>
        <NavContent pathname={pathname} />
      </aside>

      {/* Tiroir mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 sm:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: EASE }}
              className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-white/10 bg-[#07070a] px-3 py-6 sm:hidden"
            >
              <div className="flex items-center justify-between px-3 pb-6">
                <span className="text-sm font-semibold tracking-tight text-white">Onyx</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fermer le menu"
                  className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavContent pathname={pathname} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import { inter, display } from "@/lib/fonts";
import { LogoMark } from "@/components/brand/LogoMark";
import { SiteFooter } from "@/components/legal/SiteFooter";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

function Reveal({
  children,
  delay = 0,
  className,
  y = 28,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function GradientOrb({
  className,
  duration = 20,
}: {
  className: string;
  duration?: number;
}) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      animate={{ y: [0, 40, 0], x: [0, 24, 0], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Nav                                                                  */
/* ------------------------------------------------------------------ */

function Nav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 32));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#07070a]/75 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark />
          <span className={`${display.className} text-lg font-semibold tracking-tight text-white`}>
            Onyx
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
          <a href="#fonctionnalites" className="transition-colors hover:text-white">
            Fonctionnalités
          </a>
          <a href="#apercu" className="transition-colors hover:text-white">
            Aperçu
          </a>
          <a href="#tarifs" className="transition-colors hover:text-white">
            Tarifs
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/connexion"
            className="hidden text-sm text-white/70 transition-colors hover:text-white sm:block"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Essayer — 39€/mois
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                 */
/* ------------------------------------------------------------------ */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const mockupScale = useTransform(scrollYProgress, [0, 1], [1, 0.86]);
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const mockupOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);
  const heroTextY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const heroTextOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden pb-40 pt-40">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 40%, transparent 100%)",
        }}
      />
      <GradientOrb className="-left-32 -top-20 h-[30rem] w-[30rem] bg-indigo-500/25" duration={22} />
      <GradientOrb className="-right-24 top-40 h-[24rem] w-[24rem] bg-fuchsia-500/15" duration={26} />

      <motion.div
        style={{ y: heroTextY, opacity: heroTextOpacity }}
        className="relative mx-auto flex max-w-4xl flex-col items-center px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Conçu pour les auto-entrepreneurs &amp; TPE françaises
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
          className={`${display.className} text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl`}
        >
          La facturation,{" "}
          <span className="bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
            enfin claire.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.22, ease: EASE }}
          className="mt-6 max-w-2xl text-balance text-lg text-white/60 sm:text-xl"
        >
          Onyx transforme vos devis en factures conformes en un clic, suit vos paiements et relance
          vos clients automatiquement. Sans jargon comptable, sans friction.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.34, ease: EASE }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            href="/inscription"
            className="group relative overflow-hidden rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_20px_40px_-15px_rgba(139,124,255,0.5)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Démarrer mon abonnement — 39€/mois
          </Link>
          <a
            href="#apercu"
            className="rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            Voir l&apos;aperçu ↓
          </a>
        </motion.div>

        <p className="mt-5 text-xs text-white/40">
          Sans engagement · Annulation en un clic · Paiement sécurisé par Stripe
        </p>
      </motion.div>

      <motion.div
        style={{ scale: mockupScale, y: mockupY, opacity: mockupOpacity }}
        className="relative z-10 mx-auto mt-24 max-w-5xl px-6"
      >
        <HeroMockup />
      </motion.div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-2 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] backdrop-blur">
      <div className="flex items-center gap-1.5 px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
      </div>
      <div className="grid grid-cols-[220px_1fr] overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0e]">
        <div className="hidden flex-col gap-1 border-r border-white/10 p-4 sm:flex">
          {["Tableau de bord", "Clients", "Devis", "Factures", "Avoirs"].map((item, i) => (
            <div
              key={item}
              className={`rounded-lg px-3 py-2 text-xs ${
                i === 3 ? "bg-white/10 text-white" : "text-white/40"
              }`}
            >
              {item}
            </div>
          ))}
        </div>
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40">Facture n°2026-014</p>
              <p className="mt-1 text-lg font-semibold text-white">Studio Lumière</p>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
              Payée
            </span>
          </div>
          <div className="space-y-2">
            {[
              ["Prestation de conseil — juin", "1 200,00 €"],
              ["Frais de déplacement", "85,00 €"],
              ["Hébergement infrastructure", "240,00 €"],
            ].map(([label, amount]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg bg-white/[0.03] px-4 py-3 text-sm"
              >
                <span className="text-white/60">{label}</span>
                <span className="text-white/90">{amount}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-sm text-white/50">Total TTC</span>
            <span className={`${display.className} text-2xl font-semibold text-white`}>1 525,00 €</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Features — pinned scroll section                                    */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    title: "Devis en un clic",
    description:
      "Créez un devis professionnel en quelques minutes et transformez-le en facture sans jamais ressaisir une ligne.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m-8 5h10a2 2 0 002-2V7.828a2 2 0 00-.586-1.414l-3.828-3.828A2 2 0 0012.172 2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    ),
    metric: "2 min",
    metricLabel: "pour créer un devis",
  },
  {
    title: "Factures conformes",
    description:
      "Numérotation séquentielle, mentions légales, TVA par ligne : chaque facture respecte le cadre légal français, automatiquement.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 14l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    ),
    metric: "100%",
    metricLabel: "conforme au cadre légal",
  },
  {
    title: "Suivi des paiements",
    description:
      "Visualisez en un coup d'œil qui a payé, qui est en retard, et laissez Onyx relancer vos clients à votre place.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 3v18h18M7 14l4-4 3 3 5-5"
      />
    ),
    metric: "0",
    metricLabel: "relance oubliée",
  },
];

function FeaturesSticky() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const rawIndex = useTransform(scrollYProgress, [0, 1], [0, FEATURES.length - 1]);
  useMotionValueEvent(rawIndex, "change", (v) => {
    setActive(Math.min(FEATURES.length - 1, Math.max(0, Math.round(v))));
  });

  return (
    <section id="fonctionnalites" className="relative">
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-32">
        <Reveal>
          <p className="text-sm font-medium text-indigo-300/80">Fonctionnalités</p>
          <h2 className={`${display.className} mt-3 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl`}>
            Tout ce qu&apos;il faut, rien de superflu.
          </h2>
        </Reveal>
      </div>

      <div ref={containerRef} className="relative h-[300vh]">
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
            <div className="space-y-3">
              {FEATURES.map((feature, i) => (
                <button
                  key={feature.title}
                  type="button"
                  className="block w-full text-left"
                  tabIndex={-1}
                >
                  <div
                    className={`rounded-2xl border px-6 py-5 transition-all duration-500 ${
                      active === i
                        ? "border-white/15 bg-white/[0.06]"
                        : "border-transparent opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 shrink-0 text-indigo-300"
                        fill="none"
                        stroke="currentColor"
                      >
                        {feature.icon}
                      </svg>
                      <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                    </div>
                    <AnimatePresence>
                      {active === i && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.4, ease: EASE }}
                          className="mt-2 max-w-md overflow-hidden text-sm leading-relaxed text-white/60"
                        >
                          {feature.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </button>
              ))}
            </div>

            <div className="relative hidden h-80 items-center justify-center md:flex">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="w-full max-w-sm rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-8 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="mx-auto h-10 w-10 text-indigo-300"
                    fill="none"
                    stroke="currentColor"
                  >
                    {FEATURES[active]?.icon}
                  </svg>
                  <p className={`${display.className} mt-6 text-4xl font-semibold text-white`}>
                    {FEATURES[active]?.metric}
                  </p>
                  <p className="mt-2 text-sm text-white/50">{FEATURES[active]?.metricLabel}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Mockup — scroll parallax                                            */
/* ------------------------------------------------------------------ */

function MockupParallax() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [18, 0, -10]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.82, 1, 1.05]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.5]);

  return (
    <section id="apercu" className="relative overflow-hidden py-40">
      <GradientOrb className="left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 bg-indigo-500/10" duration={30} />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <p className="text-sm font-medium text-indigo-300/80">Aperçu</p>
          <h2 className={`${display.className} mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl`}>
            Une interface qui respire.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/60">
            Chaque écran est pensé pour aller droit au but : créer, envoyer, suivre. Aucun module
            comptable inutile.
          </p>
        </Reveal>
      </div>

      <div ref={ref} className="relative mx-auto mt-20 max-w-5xl px-6" style={{ perspective: 1600 }}>
        <motion.div style={{ rotateX, scale, opacity, transformStyle: "preserve-3d" }}>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-2 shadow-[0_60px_140px_-40px_rgba(0,0,0,0.85)]">
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-white/5 sm:grid-cols-3">
              {[
                { label: "Chiffre d'affaires", value: "18 420 €", trend: "+12% ce mois" },
                { label: "Factures en attente", value: "3", trend: "1 200 € à encaisser" },
                { label: "Devis en cours", value: "7", trend: "62% taux de conversion" },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#0b0b0e] p-6">
                  <p className="text-xs text-white/40">{stat.label}</p>
                  <p className={`${display.className} mt-2 text-2xl font-semibold text-white`}>{stat.value}</p>
                  <p className="mt-1 text-xs text-emerald-300/80">{stat.trend}</p>
                </div>
              ))}
            </div>
            <div className="mt-px overflow-hidden rounded-xl bg-[#0b0b0e]">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <p className="text-sm font-medium text-white">Activité récente</p>
                <span className="text-xs text-white/40">Cette semaine</span>
              </div>
              <div className="divide-y divide-white/5">
                {[
                  ["Facture n°2026-014", "Studio Lumière", "1 525,00 €", "Payée", "emerald"],
                  ["Devis n°2026-031", "Atelier Bois & Fer", "3 200,00 €", "Envoyé", "indigo"],
                  ["Facture n°2026-013", "Café Renard", "480,00 €", "En retard", "rose"],
                ].map(([ref, client, amount, status, color]) => (
                  <div key={ref} className="flex items-center justify-between px-6 py-4 text-sm">
                    <div>
                      <p className="text-white/85">{ref}</p>
                      <p className="text-xs text-white/40">{client}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white/70">{amount}</span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          color === "emerald"
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                            : color === "indigo"
                              ? "border-indigo-400/30 bg-indigo-400/10 text-indigo-300"
                              : "border-rose-400/30 bg-rose-400/10 text-rose-300"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pricing                                                              */
/* ------------------------------------------------------------------ */

const PRICING_FEATURES = [
  "Devis et factures illimités",
  "Conversion devis → facture en un clic",
  "PDF conformes, prêts à envoyer",
  "Relances de paiement automatiques",
  "Avoirs et export comptable",
  "Support par email prioritaire",
];

function Pricing() {
  return (
    <section id="tarifs" className="relative py-40">
      <GradientOrb className="-left-20 top-1/3 h-96 w-96 bg-fuchsia-500/10" duration={24} />
      <div className="mx-auto max-w-2xl px-6 text-center">
        <Reveal>
          <p className="text-sm font-medium text-indigo-300/80">Tarifs</p>
          <h2 className={`${display.className} mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl`}>
            Un seul prix. Tout est inclus.
          </h2>
          <p className="mt-4 text-white/60">
            Pas de paliers, pas de fonctionnalités verrouillées. Onyx coûte le même prix pour tout
            le monde.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-10 text-left shadow-[0_50px_120px_-40px_rgba(139,124,255,0.35)]">
            <div
              aria-hidden
              className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"
            />
            <div className="relative flex items-baseline gap-2">
              <span className={`${display.className} text-6xl font-semibold text-white`}>39€</span>
              <span className="text-white/50">/ mois</span>
            </div>
            <p className="mt-2 text-sm text-white/50">Sans engagement · résiliable en un clic</p>

            <ul className="mt-8 space-y-3">
              {PRICING_FEATURES.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-emerald-400" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/inscription"
              className="mt-10 block w-full rounded-full bg-white py-3.5 text-center text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Démarrer mon abonnement
            </Link>
            <p className="mt-4 text-center text-xs text-white/40">Paiement sécurisé par Stripe</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA + Footer                                                   */
/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <section className="relative border-t border-white/10 py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <h2 className={`${display.className} text-3xl font-semibold tracking-tight text-white sm:text-4xl`}>
            Prêt à simplifier votre facturation ?
          </h2>
          <p className="mt-4 text-white/60">
            Créez votre compte, configurez votre entreprise, envoyez votre premier devis. En moins
            de dix minutes.
          </p>
          <Link
            href="/inscription"
            className="mt-8 inline-block rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Commencer maintenant
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export function LandingPage() {
  return (
    <div className={`${inter.variable} ${display.variable} min-h-screen bg-[#07070a] font-sans text-white antialiased`}>
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <FeaturesSticky />
        <MockupParallax />
        <Pricing />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-indigo-400 via-violet-300 to-fuchsia-300"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

import Link from "next/link";
import { inter, display } from "@/lib/fonts";
import { LogoMark } from "@/components/brand/LogoMark";
import { SiteFooter } from "@/components/legal/SiteFooter";

export function LegalLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} ${display.variable} min-h-screen bg-[#07070a] font-sans text-white antialiased`}>
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark />
            <span className={`${display.className} text-lg font-semibold tracking-tight text-white`}>Onyx</span>
          </Link>
          <Link href="/" className="text-sm text-white/60 transition-colors hover:text-white">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium text-indigo-300/80">Document légal</p>
        <h1 className={`${display.className} mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl`}>
          {title}
        </h1>
        <p className="mt-2 text-sm text-white/40">Dernière mise à jour : {updatedAt}</p>

        <div className="mt-10 space-y-10">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className={`${display.className} text-xl font-semibold text-white`}>{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-white/70">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

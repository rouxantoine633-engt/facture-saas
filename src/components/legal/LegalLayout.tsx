import Link from "next/link";
import { inter, display } from "@/lib/fonts";
import { LogoMark } from "@/components/brand/LogoMark";
import { SiteFooter } from "@/components/legal/SiteFooter";
import { LEGAL_UPDATED_AT } from "@/lib/legal";

export function LegalLayout({
  title,
  updatedAt = LEGAL_UPDATED_AT,
  children,
}: {
  title: string;
  updatedAt?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} ${display.variable} on-dark min-h-screen bg-[#07070a] font-sans text-white antialiased`}>
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark />
            <span className={`${display.className} text-lg font-semibold tracking-tight text-white`}>Onyx</span>
            <span className="sr-only">— retour à l&apos;accueil</span>
          </Link>
          <Link href="/" className="text-sm text-white/70 transition-colors hover:text-white">
            <span aria-hidden>←</span> Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <main id="contenu" className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium text-indigo-300">Document légal</p>
        <h1 className={`${display.className} mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl`}>
          {title}
        </h1>
        <p className="mt-2 text-sm text-white/60">Dernière mise à jour : {updatedAt}</p>

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
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-white/75">{children}</div>
    </section>
  );
}

export function LegalSubsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mt-2 font-semibold text-white">{title}</h3>
      <div className="mt-2 space-y-3">{children}</div>
    </div>
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

export function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http") || href.startsWith("mailto:");
  const className = "text-indigo-300 underline underline-offset-2 hover:text-indigo-200";
  return external ? (
    <a href={href} className={className}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/** Valeur que l'éditeur doit encore renseigner : mise en évidence plutôt que passée sous silence. */
export function ToComplete({ children }: { children: React.ReactNode }) {
  return <mark className="rounded bg-amber-300/20 px-1 text-amber-200">{children}</mark>;
}

import Link from "next/link";
import { display } from "@/lib/fonts";
import { LogoMark } from "@/components/brand/LogoMark";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-5 w-5" />
            <span className={`${display.className} text-sm font-semibold text-white`}>Onyx</span>
          </Link>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/50">
            <Link href="/#fonctionnalites" className="transition-colors hover:text-white">
              Fonctionnalités
            </Link>
            <Link href="/#tarifs" className="transition-colors hover:text-white">
              Tarifs
            </Link>
            <Link href="/connexion" className="transition-colors hover:text-white">
              Connexion
            </Link>
            <Link href="/inscription" className="transition-colors hover:text-white">
              Créer un compte
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Mentions légales" className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/40">
            <Link href="/mentions-legales" className="transition-colors hover:text-white/70">
              Mentions légales
            </Link>
            <Link href="/cgu" className="transition-colors hover:text-white/70">
              CGU / CGV
            </Link>
            <Link href="/confidentialite" className="transition-colors hover:text-white/70">
              Confidentialité &amp; RGPD
            </Link>
          </nav>
          <p className="text-xs text-white/30">© 2026 Onyx. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

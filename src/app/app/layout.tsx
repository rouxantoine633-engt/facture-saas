import Link from "next/link";

const LINKS = [
  { href: "/app/tableau-de-bord", label: "Tableau de bord" },
  { href: "/app/devis", label: "Devis" },
  { href: "/app/factures", label: "Factures" },
  { href: "/app/avoirs", label: "Avoirs" },
  { href: "/app/clients", label: "Clients" },
  { href: "/app/export", label: "Export comptable" },
  { href: "/app/entreprise/configuration", label: "Mon entreprise" },
  { href: "/app/compte", label: "Mes données" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:bg-white focus:p-2">
        Aller au contenu
      </a>
      <nav aria-label="Navigation principale" className="border-b border-gray-200 bg-white">
        <ul className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-4 py-3 text-sm font-medium">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-gray-700 hover:text-brand-700">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main id="contenu">{children}</main>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveCompany } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Export comptable" };

const FORMATS = [
  {
    value: "csv",
    label: "CSV",
    title: "Fichier brut pour l'expert-comptable",
    description: "Un tableau qui s'ouvre directement dans Excel, avec une ligne par écriture. Idéal pour l'import en comptabilité.",
  },
  {
    value: "pdf",
    label: "PDF",
    title: "Rapport récapitulatif",
    description:
      "Un document mis en page à vos couleurs, avec votre logo, un récapitulatif par période, les totaux, le détail des écritures et vos mentions légales.",
  },
] as const;

export default async function ExportPage() {
  const { company } = await requireActiveCompany();
  const hasLogo = Boolean(await prisma.companyLogo.findUnique({ where: { companyId: company.id }, select: { companyId: true } }));
  const now = new Date();
  const from = `${now.getUTCFullYear()}-01-01`;
  const to = now.toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Export comptable</h1>
      <p className="mb-6 text-gray-600">
        Téléchargez le journal de vos ventes ou de vos encaissements, au format de votre choix.
      </p>

      <form action="/app/export/comptable" method="get" className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="from" className="block text-sm font-medium">
              Du
            </label>
            <input id="from" name="from" type="date" defaultValue={from} required className="input mt-1" />
          </div>
          <div>
            <label htmlFor="to" className="block text-sm font-medium">
              Au (inclus)
            </label>
            <input id="to" name="to" type="date" defaultValue={to} required className="input mt-1" />
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Format du fichier</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {FORMATS.map((f, i) => (
              <label
                key={f.value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"
              >
                <input type="radio" name="format" value={f.value} defaultChecked={i === 0} className="mt-1 h-4 w-4 shrink-0" />
                <span>
                  <span className="block font-semibold">
                    {f.label} <span className="font-normal text-gray-700">— {f.title}</span>
                  </span>
                  <span className="mt-1 block text-sm text-gray-600">{f.description}</span>
                </span>
              </label>
            ))}
          </div>
          {!hasLogo && (
            <p className="mt-2 text-sm text-gray-600">
              Pour personnaliser vos documents et vos rapports PDF, ajoutez votre logo dans{" "}
              <Link href="/app/entreprise/configuration" className="text-brand-700 underline">
                Mon entreprise
              </Link>
              .
            </p>
          )}
        </fieldset>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="font-semibold">Journal des ventes</h2>
            <p className="mt-1 text-sm text-gray-600">
              Les factures émises et les avoirs, avec les totaux HT / TVA / TTC et la ventilation par taux de TVA. Les avoirs
              sont en montants négatifs ; les brouillons sont exclus. Le fichier CSV ajoute le statut et le paiement de chaque
              facture.
            </p>
            <button
              type="submit"
              name="type"
              value="ventes"
              className="mt-3 rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
            >
              Télécharger le journal des ventes
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="font-semibold">Encaissements</h2>
            <p className="mt-1 text-sm text-gray-600">
              Les paiements reçus, avec la facture, le client, le moyen de paiement et la référence. Le rapport PDF ajoute un
              récapitulatif par période et par moyen de paiement.
            </p>
            <button
              type="submit"
              name="type"
              value="paiements"
              className="mt-3 rounded-md border border-brand-600 px-4 py-2 font-medium text-brand-700 hover:bg-brand-50"
            >
              Télécharger les encaissements
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

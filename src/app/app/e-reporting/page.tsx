import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveCompany } from "@/lib/session";
import { formatCentsToEuros } from "@/lib/money";
import { formatDate } from "@/lib/labels";
import { parseExportRange } from "@/lib/export/range";
import { loadEReporting } from "@/lib/ereporting/load";
import { EREPORTING_CATEGORY_LABELS } from "@/lib/ereporting/categories";
import { periodPresets } from "@/lib/ereporting/periods";

export const metadata: Metadata = { title: "E-reporting" };

const rateLabel = (ratePer100000: number) => `${(ratePer100000 / 1000).toLocaleString("fr-FR")} %`;
const dateLabel = (isoDay: string) => formatDate(new Date(`${isoDay}T00:00:00Z`));

export default async function EReportingPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const { company } = await requireActiveCompany();
  const query = await searchParams;

  const presets = periodPresets(new Date());
  const from = query.from ?? presets[0]!.from;
  const to = query.to ?? presets[0]!.to;
  const range = parseExportRange(from, to);
  const rangeError = "error" in range ? range.error : null;
  const report = "error" in range ? null : await loadEReporting(company.id, range.from, range.to);

  const exportHref = (type: string) => `/app/e-reporting/export?type=${type}&from=${from}&to=${to}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">E-reporting : ventes aux particuliers</h1>
      <p className="mb-6 text-gray-600">
        Les ventes à des particuliers ne se facturent pas par facture électronique : leurs montants (agrégés par jour,
        catégorie et taux de TVA) sont déclarés à l'administration via une plateforme agréée. Cette page prépare ces
        données ; Onyx ne les transmet pas lui-même.
      </p>

      <form method="get" className="mb-4 grid items-end gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="from" className="block text-sm font-medium">Du</label>
          <input id="from" name="from" type="date" defaultValue={from} required className="input mt-1" />
        </div>
        <div>
          <label htmlFor="to" className="block text-sm font-medium">Au (inclus)</label>
          <input id="to" name="to" type="date" defaultValue={to} required className="input mt-1" />
        </div>
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700">
          Afficher
        </button>
      </form>

      <p className="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {presets.map((p) => (
          <Link key={p.label} href={`/app/e-reporting?from=${p.from}&to=${p.to}`} className="text-brand-700 underline">
            {p.label}
          </Link>
        ))}
      </p>

      {!report ? (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-red-800">
          {rangeError ?? "Période invalide."}
        </p>
      ) : (
        <>
          {report.warnings.length > 0 && (
            <div role="alert" className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="mb-2 font-semibold">À traiter à part ({report.warnings.length})</p>
              <ul className="list-disc pl-5">
                {report.warnings.map((w) => (
                  <li key={`${w.document}-${w.message}`}>
                    <strong>{w.document}</strong> : {w.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <section className="mb-8">
            <h2 className="mb-2 text-lg font-semibold">Transactions</h2>
            {report.transactions.length === 0 ? (
              <p className="text-gray-600">Aucune facture ni aucun avoir à un particulier sur cette période.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Transactions agrégées par jour, catégorie et taux de TVA</caption>
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th scope="col" className="p-3">Date</th>
                      <th scope="col" className="p-3">Catégorie</th>
                      <th scope="col" className="p-3 text-right">Taux</th>
                      <th scope="col" className="p-3 text-right">Total HT</th>
                      <th scope="col" className="p-3 text-right">TVA</th>
                      <th scope="col" className="p-3 text-right">Total TTC</th>
                      <th scope="col" className="p-3 text-right">Documents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.transactions.map((r) => (
                      <tr key={`${r.date}-${r.category}-${r.vatRatePer100000}`}>
                        <td className="p-3">{dateLabel(r.date)}</td>
                        <td className="p-3" title={EREPORTING_CATEGORY_LABELS[r.category]}>
                          <span className="font-medium">{r.category}</span>
                        </td>
                        <td className="p-3 text-right">{rateLabel(r.vatRatePer100000)}</td>
                        <td className="p-3 text-right">{formatCentsToEuros(r.htCents)}</td>
                        <td className="p-3 text-right">{formatCentsToEuros(r.vatCents)}</td>
                        <td className="p-3 text-right">{formatCentsToEuros(r.ttcCents)}</td>
                        <td className="p-3 text-right">{r.documentCount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-medium">
                    <tr>
                      <td className="p-3" colSpan={3}>Total de la période (avoirs déduits)</td>
                      <td className="p-3 text-right">{formatCentsToEuros(report.totals.htCents)}</td>
                      <td className="p-3 text-right">{formatCentsToEuros(report.totals.vatCents)}</td>
                      <td className="p-3 text-right">{formatCentsToEuros(report.totals.ttcCents)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>

          <section className="mb-8">
            <h2 className="mb-1 text-lg font-semibold">Encaissements de prestations de services</h2>
            <p className="mb-2 text-sm text-gray-600">
              La TVA sur une prestation de services est due à l'encaissement : chaque paiement reçu d'un particulier est
              aussi à déclarer, à sa date d'encaissement.
            </p>
            {report.payments.length === 0 ? (
              <p className="text-gray-600">Aucun encaissement sur cette période.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Encaissements agrégés par jour, catégorie et taux de TVA</caption>
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th scope="col" className="p-3">Date d'encaissement</th>
                      <th scope="col" className="p-3">Catégorie</th>
                      <th scope="col" className="p-3 text-right">Taux</th>
                      <th scope="col" className="p-3 text-right">Encaissé TTC</th>
                      <th scope="col" className="p-3 text-right">dont TVA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.payments.map((r) => (
                      <tr key={`${r.date}-${r.category}-${r.vatRatePer100000}`}>
                        <td className="p-3">{dateLabel(r.date)}</td>
                        <td className="p-3 font-medium">{r.category}</td>
                        <td className="p-3 text-right">{rateLabel(r.vatRatePer100000)}</td>
                        <td className="p-3 text-right">{formatCentsToEuros(r.ttcCents)}</td>
                        <td className="p-3 text-right">{formatCentsToEuros(r.vatCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-1 font-semibold">Télécharger</h2>
            <p className="mb-3 text-sm text-gray-600">
              Fichiers à fournir à votre plateforme agréée. Ils ne sont pas au format officiel du flux : la plateforme
              impose le sien.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={exportHref("transactions")} className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700">
                Transactions (CSV)
              </a>
              <a href={exportHref("encaissements")} className="rounded-md border border-brand-600 px-4 py-2 font-medium text-brand-700 hover:bg-brand-50">
                Encaissements (CSV)
              </a>
              <a href={exportHref("json")} className="rounded-md border border-brand-600 px-4 py-2 font-medium text-brand-700 hover:bg-brand-50">
                Tout (JSON)
              </a>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

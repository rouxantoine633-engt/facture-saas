import { formatCentsToEuros, summarizeDocument } from "@/lib/money";

interface Line {
  id: string;
  description: string;
  quantity: { toString(): string };
  unitPriceCents: number;
  vatRatePer100000: number;
  lineHtCents: number;
  lineVatCents: number;
  lineTtcCents: number;
}

function formatRate(ratePer100000: number): string {
  return `${(ratePer100000 / 1000).toLocaleString("fr-FR")} %`;
}

export function LinesTable({
  lines,
  subtotalHtCents,
  totalVatCents,
  totalTtcCents,
  franchiseEnBase,
}: {
  lines: Line[];
  subtotalHtCents: number;
  totalVatCents: number;
  totalTtcCents: number;
  franchiseEnBase: boolean;
}) {
  const vatBreakdown = franchiseEnBase ? [] : summarizeDocument(lines).vatBreakdown;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Lignes du document</caption>
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th scope="col" className="p-3">Description</th>
            <th scope="col" className="p-3 text-right">Qté</th>
            <th scope="col" className="p-3 text-right">PU HT</th>
            {!franchiseEnBase && <th scope="col" className="p-3 text-right">TVA</th>}
            {!franchiseEnBase && <th scope="col" className="p-3 text-right">Montant TVA</th>}
            <th scope="col" className="p-3 text-right">Total HT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lines.map((l) => (
            <tr key={l.id}>
              <td className="p-3">{l.description}</td>
              <td className="p-3 text-right">{l.quantity.toString()}</td>
              <td className="p-3 text-right">{formatCentsToEuros(l.unitPriceCents)}</td>
              {!franchiseEnBase && <td className="p-3 text-right">{formatRate(l.vatRatePer100000)}</td>}
              {!franchiseEnBase && <td className="p-3 text-right">{formatCentsToEuros(l.lineVatCents)}</td>}
              <td className="p-3 text-right">{formatCentsToEuros(l.lineHtCents)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="text-sm">
          <tr>
            <th scope="row" colSpan={franchiseEnBase ? 3 : 5} className="p-3 text-right font-normal">Total HT</th>
            <td className="p-3 text-right">{formatCentsToEuros(subtotalHtCents)}</td>
          </tr>
          {franchiseEnBase ? (
            <tr>
              <th scope="row" colSpan={3} className="p-3 text-right font-normal">
                TVA non applicable, art. 293B du CGI
              </th>
              <td className="p-3 text-right">—</td>
            </tr>
          ) : (
            <>
              {vatBreakdown.map((b) => (
                <tr key={b.vatRatePer100000}>
                  <th scope="row" colSpan={5} className="p-3 text-right font-normal text-gray-600">
                    TVA {formatRate(b.vatRatePer100000)} (base {formatCentsToEuros(b.baseHtCents)})
                  </th>
                  <td className="p-3 text-right text-gray-600">{formatCentsToEuros(b.vatCents)}</td>
                </tr>
              ))}
              <tr>
                <th scope="row" colSpan={5} className="p-3 text-right font-normal">Total TVA</th>
                <td className="p-3 text-right">{formatCentsToEuros(totalVatCents)}</td>
              </tr>
            </>
          )}
          <tr className="font-semibold">
            <th scope="row" colSpan={franchiseEnBase ? 3 : 5} className="p-3 text-right">Total TTC</th>
            <td className="p-3 text-right">{formatCentsToEuros(totalTtcCents)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

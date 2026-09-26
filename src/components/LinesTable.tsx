import { formatCentsToEuros } from "@/lib/money";

interface Line {
  id: string;
  description: string;
  quantity: { toString(): string };
  unitPriceCents: number;
  vatRatePer100000: number;
  lineHtCents: number;
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
              <td className="p-3 text-right">{formatCentsToEuros(l.lineHtCents)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="text-sm">
          <tr>
            <th scope="row" colSpan={franchiseEnBase ? 3 : 4} className="p-3 text-right font-normal">Total HT</th>
            <td className="p-3 text-right">{formatCentsToEuros(subtotalHtCents)}</td>
          </tr>
          <tr>
            <th scope="row" colSpan={franchiseEnBase ? 3 : 4} className="p-3 text-right font-normal">
              {franchiseEnBase ? "TVA non applicable, art. 293B du CGI" : "Total TVA"}
            </th>
            <td className="p-3 text-right">{franchiseEnBase ? "—" : formatCentsToEuros(totalVatCents)}</td>
          </tr>
          <tr className="font-semibold">
            <th scope="row" colSpan={franchiseEnBase ? 3 : 4} className="p-3 text-right">Total TTC</th>
            <td className="p-3 text-right">{formatCentsToEuros(totalTtcCents)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

import { requireActiveCompany } from "@/lib/session";

export default async function ExportPage() {
  await requireActiveCompany();
  const now = new Date();
  const from = `${now.getUTCFullYear()}-01-01`;
  const to = now.toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Export comptable</h1>
      <p className="mb-6 text-gray-600">
        Téléchargez un fichier à transmettre à votre expert-comptable. Il s'ouvre directement dans Excel.
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

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="font-semibold">Journal des ventes</h2>
            <p className="mt-1 text-sm text-gray-600">
              Une ligne par facture émise et par avoir, avec les totaux HT / TVA / TTC, la ventilation par taux de TVA,
              le statut et le paiement. Les avoirs sont en montants négatifs. Les brouillons sont exclus.
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
            <p className="mt-1 text-sm text-gray-600">Un paiement par ligne, avec la facture, le moyen et la référence.</p>
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

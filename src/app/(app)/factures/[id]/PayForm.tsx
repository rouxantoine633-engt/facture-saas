"use client";

import { useState } from "react";
import { markPaidAction } from "../actions";

export function PayForm({ invoiceId }: { invoiceId: string }) {
  const [method, setMethod] = useState("VIREMENT");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await markPaidAction(invoiceId, method);
    setPending(false);
    if (result.error) setError(result.error);
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="method" className="block text-sm font-medium">
          Moyen de paiement reçu
        </label>
        <select id="method" value={method} onChange={(e) => setMethod(e.target.value)} className="input mt-1">
          <option value="VIREMENT">Virement</option>
          <option value="CHEQUE">Chèque</option>
          <option value="ESPECES">Espèces</option>
          <option value="CARTE">Carte bancaire</option>
          <option value="PRELEVEMENT">Prélèvement</option>
          <option value="AUTRE">Autre</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800 disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Marquer comme payée"}
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

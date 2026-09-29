"use client";

import { useState } from "react";
import { formatCentsToEuros } from "@/lib/money";
import { recordPaymentAction } from "../actions";

function centsToEurosInput(cents: number): string {
  return `${Math.trunc(cents / 100)},${String(cents % 100).padStart(2, "0")}`;
}

export function PayForm({ invoiceId, remainingCents }: { invoiceId: string; remainingCents: number }) {
  const [amount, setAmount] = useState(centsToEurosInput(remainingCents));
  const [method, setMethod] = useState("VIREMENT");
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await recordPaymentAction({ invoiceId, amount, method, paidAt, reference });
    setPending(false);
    if (result.error) setError(result.error);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h2 className="font-semibold">Enregistrer un paiement</h2>
      <p className="text-sm text-gray-600">Reste dû : {formatCentsToEuros(remainingCents)}</p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium">
            Montant reçu (€)
          </label>
          <input
            id="amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input mt-1 w-32"
            required
          />
        </div>
        <div>
          <label htmlFor="paidAt" className="block text-sm font-medium">
            Date du paiement
          </label>
          <input
            id="paidAt"
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="input mt-1"
            required
          />
        </div>
        <div>
          <label htmlFor="method" className="block text-sm font-medium">
            Moyen de paiement
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
        <div>
          <label htmlFor="reference" className="block text-sm font-medium">
            Référence (facultatif)
          </label>
          <input
            id="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="input mt-1"
            placeholder="N° de chèque, virement…"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800 disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer le paiement"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

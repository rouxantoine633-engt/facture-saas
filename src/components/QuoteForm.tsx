"use client";

import { useMemo, useState } from "react";
import {
  computeLineTotals,
  formatCentsToEuros,
  parseDecimalToScaledBigInt,
  summarizeDocument,
  FRENCH_VAT_RATES,
  type ComputedLine,
} from "@/lib/money";

interface ClientOption {
  id: string;
  name: string;
}

interface LineState {
  description: string;
  quantity: string;
  unitPrice: string; // euros, saisie utilisateur
  vatRatePer100000: number;
}

export interface QuoteFormPayload {
  clientId: string;
  issueDate: string;
  validUntil: string;
  notes: string;
  lines: Array<{ description: string; quantity: string; unitPriceCents: number; vatRatePer100000: number }>;
}

export interface QuoteFormInitial {
  clientId: string;
  issueDate: string;
  validUntil: string;
  notes: string;
  lines: LineState[];
}

const VAT_OPTIONS = [
  { value: FRENCH_VAT_RATES.NORMAL, label: "20 %" },
  { value: FRENCH_VAT_RATES.INTERMEDIAIRE, label: "10 %" },
  { value: FRENCH_VAT_RATES.REDUIT, label: "5,5 %" },
  { value: FRENCH_VAT_RATES.PARTICULIER, label: "2,1 %" },
  { value: FRENCH_VAT_RATES.EXONERE, label: "0 %" },
];

function eurosToCents(input: string): number | null {
  try {
    const cents = parseDecimalToScaledBigInt(input.replace(",", ".").trim(), 2);
    return cents >= 0n ? Number(cents) : null;
  } catch {
    return null;
  }
}

const emptyLine = (vat: number): LineState => ({
  description: "",
  quantity: "1",
  unitPrice: "",
  vatRatePer100000: vat,
});

export function QuoteForm({
  clients,
  franchiseEnBase,
  initial,
  submitAction,
  submitLabel,
  pendingLabel,
}: {
  clients: ClientOption[];
  franchiseEnBase: boolean;
  initial?: QuoteFormInitial;
  submitAction: (payload: QuoteFormPayload) => Promise<{ error?: string } | void>;
  submitLabel: string;
  pendingLabel: string;
}) {
  const defaultVat = franchiseEnBase ? FRENCH_VAT_RATES.EXONERE : FRENCH_VAT_RATES.NORMAL;
  const today = new Date().toISOString().slice(0, 10);

  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [issueDate, setIssueDate] = useState(initial?.issueDate ?? today);
  const [validUntil, setValidUntil] = useState(initial?.validUntil ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [lines, setLines] = useState<LineState[]>(initial?.lines ?? [emptyLine(defaultVat)]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const preview = useMemo(() => {
    const computed: ComputedLine[] = [];
    for (const l of lines) {
      const cents = eurosToCents(l.unitPrice);
      if (cents === null) continue;
      try {
        const rate = franchiseEnBase ? 0 : l.vatRatePer100000;
        computed.push({
          ...computeLineTotals({ quantity: l.quantity.replace(",", "."), unitPriceCents: cents, vatRatePer100000: rate }),
          vatRatePer100000: rate,
        });
      } catch {
        // ligne en cours de saisie : ignorée dans l'aperçu
      }
    }
    return summarizeDocument(computed);
  }, [lines, franchiseEnBase]);

  function updateLine(index: number, patch: Partial<LineState>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payloadLines = [];
    for (const [i, l] of lines.entries()) {
      const cents = eurosToCents(l.unitPrice);
      if (cents === null) {
        setError(`Ligne ${i + 1} : saisissez un prix unitaire valide (ex : 45,50).`);
        return;
      }
      payloadLines.push({
        description: l.description,
        quantity: l.quantity,
        unitPriceCents: cents,
        vatRatePer100000: franchiseEnBase ? 0 : l.vatRatePer100000,
      });
    }

    setPending(true);
    const result = await submitAction({ clientId, issueDate, validUntil, notes, lines: payloadLines });
    // En cas de succès, l'action redirige : on n'arrive ici qu'en cas d'erreur.
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label htmlFor="client" className="block text-sm font-medium">
            Client *
          </label>
          <select
            id="client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="input mt-1"
            required
          >
            <option value="">— Choisir un client —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="issueDate" className="block text-sm font-medium">
            Date du devis *
          </label>
          <input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="input mt-1" required />
        </div>
        <div>
          <label htmlFor="validUntil" className="block text-sm font-medium">
            Valable jusqu'au
          </label>
          <input id="validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="input mt-1" />
        </div>
      </div>

      <fieldset>
        <legend className="mb-3 text-lg font-semibold">Prestations</legend>
        <div className="space-y-4">
          {lines.map((l, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <label htmlFor={`desc-${i}`} className="block text-sm font-medium">
                  Description
                </label>
                <input id={`desc-${i}`} value={l.description} onChange={(e) => updateLine(i, { description: e.target.value })} className="input mt-1" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`qty-${i}`} className="block text-sm font-medium">
                  Quantité
                </label>
                <input id={`qty-${i}`} inputMode="decimal" value={l.quantity} onChange={(e) => updateLine(i, { quantity: e.target.value })} className="input mt-1" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`price-${i}`} className="block text-sm font-medium">
                  Prix unitaire HT (€)
                </label>
                <input id={`price-${i}`} inputMode="decimal" value={l.unitPrice} onChange={(e) => updateLine(i, { unitPrice: e.target.value })} className="input mt-1" />
              </div>
              {!franchiseEnBase && (
                <div className="sm:col-span-2">
                  <label htmlFor={`vat-${i}`} className="block text-sm font-medium">
                    TVA
                  </label>
                  <select id={`vat-${i}`} value={l.vatRatePer100000} onChange={(e) => updateLine(i, { vatRatePer100000: Number(e.target.value) })} className="input mt-1">
                    {VAT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-end sm:col-span-1">
                <button
                  type="button"
                  onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                  disabled={lines.length === 1}
                  aria-label={`Supprimer la ligne ${i + 1}`}
                  className="rounded-md border border-gray-300 px-2 py-2 text-sm hover:bg-gray-100 disabled:opacity-40"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, emptyLine(defaultVat)])}
          className="mt-3 text-sm font-medium text-brand-700 underline"
        >
          + Ajouter une ligne
        </button>
      </fieldset>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes (facultatif)
        </label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input mt-1" />
      </div>

      <section aria-label="Totaux" className="ml-auto max-w-xs space-y-1 rounded-lg border border-gray-200 bg-white p-4 text-sm">
        <div className="flex justify-between">
          <span>Total HT</span>
          <span>{formatCentsToEuros(preview.subtotalHtCents)}</span>
        </div>
        {franchiseEnBase ? (
          <p className="text-gray-600">TVA non applicable, art. 293B du CGI</p>
        ) : (
          <div className="flex justify-between">
            <span>Total TVA</span>
            <span>{formatCentsToEuros(preview.totalVatCents)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-200 pt-1 text-base font-semibold">
          <span>Total TTC</span>
          <span>{formatCentsToEuros(preview.totalTtcCents)}</span>
        </div>
      </section>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-600 px-6 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}

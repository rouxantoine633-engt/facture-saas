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
import { createCreditNoteAction } from "@/app/(app)/avoirs/actions";

interface InitialLine {
  description: string;
  quantity: string;
  unitPriceCents: number;
  vatRatePer100000: number;
}

interface LineState {
  description: string;
  quantity: string;
  unitPrice: string;
  vatRatePer100000: number;
}

const VAT_OPTIONS = [
  { value: FRENCH_VAT_RATES.NORMAL, label: "20 %" },
  { value: FRENCH_VAT_RATES.INTERMEDIAIRE, label: "10 %" },
  { value: FRENCH_VAT_RATES.REDUIT, label: "5,5 %" },
  { value: FRENCH_VAT_RATES.PARTICULIER, label: "2,1 %" },
  { value: FRENCH_VAT_RATES.EXONERE, label: "0 %" },
];

function centsToEurosInput(cents: number): string {
  return `${Math.trunc(cents / 100)},${String(cents % 100).padStart(2, "0")}`;
}

function eurosToCents(input: string): number | null {
  try {
    const cents = parseDecimalToScaledBigInt(input.replace(",", ".").trim(), 2);
    return cents >= 0n ? Number(cents) : null;
  } catch {
    return null;
  }
}

export function CreditNoteForm({
  invoiceId,
  initialLines,
  franchiseEnBase,
  maxCreditCents,
}: {
  invoiceId: string;
  initialLines: InitialLine[];
  franchiseEnBase: boolean;
  maxCreditCents: number;
}) {
  const [reason, setReason] = useState("");
  const [lines, setLines] = useState<LineState[]>(
    initialLines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: centsToEurosInput(l.unitPriceCents),
      vatRatePer100000: l.vatRatePer100000,
    }))
  );
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

  const tooHigh = preview.totalTtcCents > maxCreditCents;

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
    const result = await createCreditNoteAction({ invoiceId, reason, lines: payloadLines });
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <div>
        <label htmlFor="reason" className="block text-sm font-medium">
          Motif de l'avoir *
        </label>
        <input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input mt-1"
          placeholder="Ex : erreur de prix, prestation annulée"
          required
        />
      </div>

      <fieldset>
        <legend className="mb-1 text-lg font-semibold">Lignes à créditer</legend>
        <p className="mb-3 text-sm text-gray-600">
          Les lignes de la facture sont reprises. Modifiez les quantités ou les prix pour un avoir partiel, ou supprimez
          les lignes non concernées.
        </p>
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
      </fieldset>

      <section aria-label="Totaux de l'avoir" className="ml-auto max-w-xs space-y-1 rounded-lg border border-gray-200 bg-white p-4 text-sm">
        <div className="flex justify-between">
          <span>Total HT</span>
          <span>{formatCentsToEuros(preview.subtotalHtCents)}</span>
        </div>
        {!franchiseEnBase && (
          <div className="flex justify-between">
            <span>Total TVA</span>
            <span>{formatCentsToEuros(preview.totalVatCents)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-200 pt-1 text-base font-semibold">
          <span>Total TTC de l'avoir</span>
          <span>{formatCentsToEuros(preview.totalTtcCents)}</span>
        </div>
        <p className={tooHigh ? "text-red-700" : "text-gray-600"}>
          Maximum créditable : {formatCentsToEuros(maxCreditCents)} TTC
        </p>
      </section>

      <p className="text-sm text-gray-700">
        Un avoir est définitif : il recevra son numéro officiel et ne pourra plus être modifié ni supprimé.
      </p>

      {error && (
        <p role="alert" className="whitespace-pre-line text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || tooHigh}
        className="rounded-md bg-brand-600 px-6 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Émission…" : "Émettre l'avoir"}
      </button>
    </form>
  );
}

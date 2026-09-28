"use client";

import { useState } from "react";
import type { QuoteStatus } from "@prisma/client";
import { MANUAL_QUOTE_STATUSES } from "@/lib/quote-status";
import { QUOTE_STATUS_LABELS } from "@/lib/labels";
import { updateQuoteStatusAction } from "../actions";

export function QuoteStatusForm({ quoteId, currentStatus }: { quoteId: string; currentStatus: QuoteStatus }) {
  const [status, setStatus] = useState<QuoteStatus>(
    MANUAL_QUOTE_STATUSES.includes(currentStatus) ? currentStatus : "SENT"
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await updateQuoteStatusAction(quoteId, status);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="quote-status" className="block text-sm font-medium">
          Statut du devis
        </label>
        <select
          id="quote-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as QuoteStatus)}
          className="input mt-1"
        >
          {MANUAL_QUOTE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {QUOTE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending || status === currentStatus}
        className="rounded-md border border-brand-600 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
      >
        {pending ? "Mise à jour…" : "Mettre à jour le statut"}
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

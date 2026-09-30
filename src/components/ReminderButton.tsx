"use client";

import { useState } from "react";

/**
 * Bouton compact "Relancer" pour une ligne de tableau ou le détail d'une facture.
 * Même logique que ActionButton (pending / erreur / confirmation) mais un gabarit
 * resserré adapté à une cellule de liste.
 */
export function ReminderButton({ action }: { action: () => Promise<{ error?: string } | void> }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function run() {
    if (!window.confirm("Envoyer une relance par email à ce client maintenant ?")) return;
    setPending(true);
    setError(null);
    const result = await action();
    setPending(false);
    if (result?.error) setError(result.error);
    else setSent(true);
  }

  if (sent) {
    return <span className="text-xs font-medium text-green-700">Relance envoyée</span>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Relancer"}
      </button>
      {error && <p role="alert" className="mt-1 max-w-[16rem] text-xs text-red-600">{error}</p>}
    </div>
  );
}

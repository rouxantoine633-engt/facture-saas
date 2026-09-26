"use client";

import { useState } from "react";

/** Bouton qui déclenche une action serveur et affiche son erreur éventuelle. Redirige côté serveur en cas de succès. */
export function ActionButton({
  action,
  label,
  pendingLabel,
  confirmMessage,
}: {
  action: () => Promise<{ error?: string } | void>;
  label: string;
  pendingLabel: string;
  confirmMessage?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setPending(true);
    setError(null);
    const result = await action();
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? pendingLabel : label}
      </button>
      {error && (
        <p role="alert" className="mt-2 whitespace-pre-line text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

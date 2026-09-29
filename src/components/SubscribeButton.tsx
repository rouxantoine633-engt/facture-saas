"use client";

import { useState } from "react";

export function SubscribeButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        setError(data?.error ?? "Impossible de démarrer le paiement. Réessayez.");
        setPending(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Impossible de démarrer le paiement. Réessayez.");
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Redirection vers Stripe…" : "S'abonner — 39 € / mois"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

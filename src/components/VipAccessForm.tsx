"use client";

import { useState } from "react";
import { activateVipAccessAction } from "@/app/app/entreprise/configuration/actions";

/** Repli pour activer un accès VIP (démo commerciale) en dehors du parcours d'inscription. */
export function VipAccessForm() {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setPending(true);
    setError(null);
    const result = await activateVipAccessAction(code.trim());
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    window.location.href = "/app/tableau-de-bord";
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-2">
      <div>
        <label htmlFor="vipCodeFallback" className="block text-xs font-medium text-gray-500">
          Code d'accès VIP (démo commerciale)
        </label>
        <input
          id="vipCodeFallback"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          className="input"
        />
      </div>
      <button
        type="submit"
        disabled={pending || !code.trim()}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
      >
        {pending ? "Activation…" : "Activer"}
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

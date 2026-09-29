"use client";

import { useState } from "react";
import { deleteAccountAction } from "./actions";

export function DeleteAccountForm({
  email,
  strategy,
}: {
  email: string;
  strategy: "HARD_DELETE" | "ANONYMIZE";
}) {
  const [confirmation, setConfirmation] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await deleteAccountAction(confirmation);
    setPending(false);
    if (result.error) setError(result.error);
    // En cas de succès, l'action redirige après déconnexion.
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-red-300 bg-red-50 p-4" noValidate>
      <h2 className="font-semibold text-red-900">Supprimer mon compte</h2>
      {strategy === "HARD_DELETE" ? (
        <p className="text-sm text-red-900">
          Vous n'avez émis aucun devis ni facture : toutes vos données seront supprimées immédiatement et
          définitivement.
        </p>
      ) : (
        <p className="text-sm text-red-900">
          Vous avez émis au moins une facture ou un avoir : la loi française impose de les conserver 10 ans (Code de
          commerce). Vos informations personnelles (identité, coordonnées, mot de passe) seront anonymisées et votre
          connexion définitivement révoquée, mais les factures et avoirs déjà émis resteront visibles avec les
          mentions qu'ils portaient au moment de leur émission.
        </p>
      )}
      <div>
        <label htmlFor="confirm-email" className="block text-sm font-medium text-red-900">
          Pour confirmer, saisissez votre adresse email ({email})
        </label>
        <input
          id="confirm-email"
          type="email"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className="input mt-1"
          required
        />
      </div>
      <label className="flex items-start gap-2 text-sm text-red-900">
        <input
          type="checkbox"
          checked={understood}
          onChange={(e) => setUnderstood(e.target.checked)}
          className="mt-1"
          required
        />
        <span>Je comprends que cette action est irréversible et je serai déconnecté immédiatement.</span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !understood || confirmation.trim() === ""}
        className="rounded-md bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800 disabled:opacity-50"
      >
        {pending ? "Suppression…" : "Supprimer définitivement mon compte"}
      </button>
    </form>
  );
}

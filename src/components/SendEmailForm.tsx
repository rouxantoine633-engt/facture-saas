"use client";

import { useState } from "react";
import { sendDocumentEmailAction } from "@/app/(app)/email-actions";

export function SendEmailForm({
  kind,
  documentId,
  defaultTo,
  lastSent,
}: {
  kind: "INVOICE" | "QUOTE";
  documentId: string;
  defaultTo: string;
  lastSent?: string;
}) {
  const [to, setTo] = useState(defaultTo);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setDone(false);
    const result = await sendDocumentEmailAction({ kind, documentId, to, message });
    setPending(false);
    if (result.error) setError(result.error);
    else setDone(true);
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4" noValidate>
      <h2 className="font-semibold">Envoyer par email</h2>
      {lastSent && <p className="text-sm text-gray-600">{lastSent}</p>}
      <div>
        <label htmlFor="email-to" className="block text-sm font-medium">
          Adresse du destinataire
        </label>
        <input id="email-to" type="email" required value={to} onChange={(e) => setTo(e.target.value)} className="input mt-1" />
      </div>
      <div>
        <label htmlFor="email-message" className="block text-sm font-medium">
          Message (facultatif)
        </label>
        <textarea id="email-message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="input mt-1" />
      </div>
      <p className="text-xs text-gray-500">Le PDF est joint automatiquement. Le client pourra vous répondre directement.</p>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="text-sm text-green-700">
          Email envoyé à {to}.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}

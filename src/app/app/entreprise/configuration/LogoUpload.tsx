"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_LOGO_BYTES } from "@/lib/logo";
import { removeLogoAction, uploadLogoAction } from "./logo-actions";

/** Logo de l'entreprise (PNG ou JPEG), utilisé en en-tête des rapports PDF. */
export function LogoUpload({ hasLogo, version }: { hasLogo: boolean; version: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    const result = await uploadLogoAction(new FormData(e.currentTarget));
    setPending(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    if (inputRef.current) inputRef.current.value = "";
    setMessage({ type: "ok", text: "Logo enregistré." });
    router.refresh();
  }

  async function remove() {
    setPending(true);
    setMessage(null);
    const result = await removeLogoAction();
    setPending(false);
    if (result.error) setMessage({ type: "error", text: result.error });
    else {
      setMessage({ type: "ok", text: "Logo supprimé." });
      router.refresh();
    }
  }

  return (
    <section aria-labelledby="logo-title" className="mx-auto mb-8 max-w-2xl space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <h2 id="logo-title" className="text-lg font-semibold">
        Logo de l'entreprise
      </h2>
      <p className="text-sm text-gray-600">
        Affiché en en-tête de vos rapports PDF (journal des ventes, encaissements). PNG ou JPEG, {Math.round(MAX_LOGO_BYTES / 1024)} Ko
        maximum.
      </p>

      {hasLogo && (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/app/entreprise/logo?v=${version}`}
            alt="Logo actuel de l'entreprise"
            className="max-h-16 max-w-[12rem] rounded border border-gray-200 bg-white object-contain p-1"
          />
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-60"
          >
            Supprimer le logo
          </button>
        </div>
      )}

      <form onSubmit={upload} className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="logo" className="block text-sm font-medium">
            {hasLogo ? "Remplacer le logo" : "Ajouter un logo"}
          </label>
          <input ref={inputRef} id="logo" name="logo" type="file" accept="image/png,image/jpeg" required className="mt-1 block text-sm" />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Envoi…" : "Enregistrer le logo"}
        </button>
      </form>

      {message && (
        <p role={message.type === "error" ? "alert" : "status"} className={message.type === "error" ? "text-sm text-red-700" : "text-sm text-green-800"}>
          {message.text}
        </p>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { registerAction, type RegisterFormState } from "./actions";

const initialState: RegisterFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Création du compte…" : "Créer mon compte"}
    </button>
  );
}

export default function InscriptionPage() {
  const [state, formAction] = useFormState(registerAction, initialState);

  if (state.success) {
    return (
      <div className="mx-auto mt-24 max-w-sm text-center">
        <h1 className="text-xl font-semibold">Compte créé !</h1>
        <p className="mt-2 text-gray-600">
          Tu peux maintenant te connecter.
        </p>
        <Link
          href="/connexion"
          className="mt-4 inline-block text-brand-600 underline"
        >
          Aller à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-24 max-w-sm">
      <h1 className="text-xl font-semibold">Créer un compte</h1>
      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Nom
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Mot de passe (10 caractères minimum)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        <SubmitButton />
      </form>
      <p className="mt-4 text-sm text-gray-600">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-brand-600 underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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
  const router = useRouter();
  const [state, formAction] = useFormState(registerAction, initialState);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [autoLoginFailed, setAutoLoginFailed] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // En cas d'erreur, le nom et l'email saisis sont conservés : seul le mot
  // de passe est vidé et signalé, pour permettre de le corriger directement
  // sans tout ressaisir.
  useEffect(() => {
    if (state.error) {
      setPassword("");
      passwordRef.current?.focus();
    }
  }, [state]);

  // Compte créé : connexion automatique puis enchaînement direct sur la
  // configuration de l'entreprise, sans repasser par l'écran de connexion.
  useEffect(() => {
    if (!state.success) return;
    let cancelled = false;
    (async () => {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (cancelled) return;
      if (result?.error) {
        setAutoLoginFailed(true);
        return;
      }
      router.push("/app/entreprise/configuration?onboarding=1");
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  if (state.success) {
    return (
      <div className="mx-auto mt-24 max-w-sm text-center">
        <h1 className="text-xl font-semibold">Compte créé !</h1>
        <p className="mt-2 text-gray-600">
          {autoLoginFailed
            ? "Connecte-toi pour continuer la configuration de ton entreprise."
            : "Connexion en cours…"}
        </p>
        {autoLoginFailed && (
          <Link
            href="/connexion"
            className="mt-4 inline-block text-brand-600 underline"
          >
            Aller à la connexion
          </Link>
        )}
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
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Mot de passe (10 caractères minimum)
          </label>
          <input
            ref={passwordRef}
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "password-error" : undefined}
            className={`mt-1 w-full rounded-md border px-3 py-2 ${
              state.error
                ? "border-red-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                : "border-gray-300"
            }`}
          />
        </div>
        {state.error && (
          <p id="password-error" role="alert" className="text-sm text-red-600">
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

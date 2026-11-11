"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useFormState, useFormStatus } from "react-dom";
import { readGodmodeCandidates } from "@/lib/godmode-param";
import { registerAction, provisionDemoAccountAction, type RegisterFormState } from "./actions";

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
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [autoLoginFailed, setAutoLoginFailed] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);

  // En cas d'erreur, les champs saisis sont conservés (seul le mot de passe
  // est vidé, par prudence) et le focus se place sur le champ en cause, pour
  // corriger directement sans tout ressaisir.
  useEffect(() => {
    if (!state.error) return;
    setPassword("");
    const target = { name: nameRef, email: emailRef, acceptTerms: termsRef, password: passwordRef }[state.field ?? "password"];
    target.current?.focus();
  }, [state]);

  const invalid = (field: NonNullable<RegisterFormState["field"]>) => (state.error && state.field === field ? true : undefined);

  // Compte créé : connexion automatique puis enchaînement direct sur la
  // configuration de l'entreprise, sans repasser par l'écran de connexion.
  // Démo commerciale (lien secret ?godmode=<code>) : saute entièrement la
  // configuration et Stripe, avec une entreprise fictive provisionnée pour
  // l'occasion. Un code absent ou invalide ne change rien au parcours normal.
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
      for (const candidate of readGodmodeCandidates(window.location.search)) {
        const demo = await provisionDemoAccountAction(candidate);
        if (cancelled) return;
        if (demo.success) {
          router.push("/app/tableau-de-bord");
          return;
        }
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
            ref={nameRef}
            aria-invalid={invalid("name")}
            aria-describedby={invalid("name") ? "form-error" : undefined}
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
            ref={emailRef}
            aria-invalid={invalid("email")}
            aria-describedby={invalid("email") ? "form-error" : undefined}
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
            aria-invalid={invalid("password")}
            aria-describedby={invalid("password") ? "form-error" : undefined}
            className={`mt-1 w-full rounded-md border px-3 py-2 ${
              invalid("password")
                ? "border-red-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                : "border-gray-300"
            }`}
          />
        </div>
        <div className="flex items-start gap-2">
          <input
            ref={termsRef}
            id="acceptTerms"
            name="acceptTerms"
            type="checkbox"
            required
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            aria-invalid={invalid("acceptTerms")}
            aria-describedby={invalid("acceptTerms") ? "form-error" : undefined}
            className="mt-1 h-4 w-4 shrink-0"
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-700">
            J’ai lu et j’accepte les{" "}
            <Link href="/cgu" target="_blank" rel="noopener" className="text-brand-700 underline">
              CGU<span className="sr-only"> (s’ouvre dans un nouvel onglet)</span>
            </Link>{" "}
            et les{" "}
            <Link href="/cgv" target="_blank" rel="noopener" className="text-brand-700 underline">
              CGV<span className="sr-only"> (s’ouvre dans un nouvel onglet)</span>
            </Link>
            .
          </label>
        </div>
        {state.error && (
          <p id="form-error" role="alert" className="text-sm text-red-700">
            {state.error}
          </p>
        )}
        <SubmitButton />
        <p className="text-xs text-gray-600">
          Vos données servent uniquement à faire fonctionner le service, sans suivi publicitaire. Détails dans la{" "}
          <Link href="/confidentialite" target="_blank" rel="noopener" className="text-brand-700 underline">
            politique de confidentialité<span className="sr-only"> (s’ouvre dans un nouvel onglet)</span>
          </Link>
          .
        </p>
      </form>
      <p className="mt-4 text-sm text-gray-700">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-brand-700 underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

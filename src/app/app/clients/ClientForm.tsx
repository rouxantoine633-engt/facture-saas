"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createClientAction, type ClientFormState } from "./actions";

const initial: ClientFormState = {};

export interface ClientFormDefaults {
  type: "INDIVIDUAL" | "BUSINESS";
  name: string;
  siret: string;
  vatNumber: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
  phone: string;
}

const EMPTY: ClientFormDefaults = {
  type: "BUSINESS",
  name: "",
  siret: "",
  vatNumber: "",
  addressLine1: "",
  postalCode: "",
  city: "",
  country: "France",
  email: "",
  phone: "",
};

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function ClientForm({
  action: formAction = createClientAction,
  defaults,
  submitLabel = "Ajouter le client",
  pendingLabel = "Ajout…",
  successMessage = "Client ajouté.",
}: {
  action?: (prev: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  defaults?: ClientFormDefaults;
  submitLabel?: string;
  pendingLabel?: string;
  successMessage?: string;
}) {
  const [state, action] = useFormState(formAction, initial);
  // Champs contrôlés : React vide un formulaire non contrôlé après chaque
  // action, y compris sur une erreur de validation, ce qui ferait perdre la
  // saisie. Seule une création réussie remet le formulaire à blanc.
  const [values, setValues] = useState<ClientFormDefaults>(defaults ?? EMPTY);
  const field = <K extends keyof ClientFormDefaults>(key: K) => ({
    value: values[key],
    onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  useEffect(() => {
    if (state.success && !defaults) setValues(EMPTY);
  }, [state, defaults]);

  return (
    <form action={action} className="space-y-4" noValidate>
      <Field id="type" label="Type de client">
        <select id="type" name="type" className="input" {...field("type")}>
          <option value="BUSINESS">Professionnel (entreprise)</option>
          <option value="INDIVIDUAL">Particulier</option>
        </select>
      </Field>
      <Field id="name" label="Nom ou raison sociale *">
        <input id="name" name="name" required {...field("name")} className="input" />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="siret" label="SIRET (14 chiffres, si professionnel)">
          <input id="siret" name="siret" inputMode="numeric" {...field("siret")} className="input" />
        </Field>
        <Field id="vatNumber" label="N° de TVA du client">
          <input id="vatNumber" name="vatNumber" {...field("vatNumber")} className="input" />
        </Field>
      </div>
      <Field id="addressLine1" label="Adresse *">
        <input id="addressLine1" name="addressLine1" required {...field("addressLine1")} className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field id="postalCode" label="Code postal *">
          <input id="postalCode" name="postalCode" required {...field("postalCode")} className="input" />
        </Field>
        <Field id="city" label="Ville *">
          <input id="city" name="city" required {...field("city")} className="input" />
        </Field>
      </div>
      <input type="hidden" name="country" value={values.country} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="email" label="Email">
          <input id="email" name="email" type="email" {...field("email")} className="input" />
        </Field>
        <Field id="phone" label="Téléphone">
          <input id="phone" name="phone" {...field("phone")} className="input" />
        </Field>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm text-green-700">
          {successMessage}
        </p>
      )}
      <Submit label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}

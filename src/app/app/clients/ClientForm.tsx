"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createClientAction, type ClientFormState } from "./actions";

const initial: ClientFormState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Ajout…" : "Ajouter le client"}
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

export function ClientForm() {
  const [state, action] = useFormState(createClientAction, initial);

  return (
    <form action={action} className="space-y-4" noValidate>
      <Field id="type" label="Type de client">
        <select id="type" name="type" className="input" defaultValue="BUSINESS">
          <option value="BUSINESS">Professionnel (entreprise)</option>
          <option value="INDIVIDUAL">Particulier</option>
        </select>
      </Field>
      <Field id="name" label="Nom ou raison sociale *">
        <input id="name" name="name" required className="input" />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="siret" label="SIRET (14 chiffres, si professionnel)">
          <input id="siret" name="siret" inputMode="numeric" className="input" />
        </Field>
        <Field id="vatNumber" label="N° de TVA du client">
          <input id="vatNumber" name="vatNumber" className="input" />
        </Field>
      </div>
      <Field id="addressLine1" label="Adresse *">
        <input id="addressLine1" name="addressLine1" required className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field id="postalCode" label="Code postal *">
          <input id="postalCode" name="postalCode" required className="input" />
        </Field>
        <Field id="city" label="Ville *">
          <input id="city" name="city" required className="input" />
        </Field>
      </div>
      <input type="hidden" name="country" value="France" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="email" label="Email">
          <input id="email" name="email" type="email" className="input" />
        </Field>
        <Field id="phone" label="Téléphone">
          <input id="phone" name="phone" className="input" />
        </Field>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm text-green-700">
          Client ajouté.
        </p>
      )}
      <Submit />
    </form>
  );
}

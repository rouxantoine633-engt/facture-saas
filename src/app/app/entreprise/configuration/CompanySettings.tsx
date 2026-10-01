"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  companySchema,
  LEGAL_FORM_LABELS,
  VAT_REGIME_LABELS,
  type CompanyInput,
} from "@/lib/validation/company";
import { parseOffsetsInput } from "@/lib/reminders";
import { saveCompanyAction } from "./actions";

const LEGAL_FORMS_WITH_RCS = new Set(["EURL", "SARL", "SASU", "SAS"]);

export function CompanySettings({
  defaultValues,
}: {
  defaultValues: Partial<CompanyInput>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      country: "France",
      defaultPaymentTermsDays: 30,
      reminderOffsetsDays: [7, 15],
      ...defaultValues,
    },
  });

  const legalForm = watch("legalForm");
  const vatRegime = watch("vatRegime");
  const rcsRequired = LEGAL_FORMS_WITH_RCS.has(legalForm);
  const vatNumberRequired = vatRegime && vatRegime !== "FRANCHISE_EN_BASE";

  async function onSubmit(data: CompanyInput) {
    setServerError(null);
    setSaved(false);
    const result = await saveCompanyAction(data);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-2xl space-y-8 pb-16"
      noValidate
    >
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Identité de l'entreprise</h2>

        <Field label="Raison sociale" error={errors.legalName?.message} required>
          <input {...register("legalName")} className="input" />
        </Field>

        <Field label="Nom commercial (si différent)" error={errors.commercialName?.message}>
          <input {...register("commercialName")} className="input" />
        </Field>

        <Field label="Forme juridique" error={errors.legalForm?.message} required>
          <select {...register("legalForm")} className="input">
            <option value="">— Choisir —</option>
            {Object.entries(LEGAL_FORM_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="SIREN (9 chiffres)" error={errors.siren?.message} required>
            <input {...register("siren")} className="input" inputMode="numeric" />
          </Field>
          <Field label="SIRET (14 chiffres)" error={errors.siret?.message} required>
            <input {...register("siret")} className="input" inputMode="numeric" />
          </Field>
        </div>

        {rcsRequired && (
          <div className="grid grid-cols-2 gap-4 rounded-md bg-brand-50 p-4">
            <Field label="Ville RCS" error={errors.rcsCity?.message} required>
              <input {...register("rcsCity")} className="input" />
            </Field>
            <Field label="Numéro RCS" error={errors.rcsNumber?.message} required>
              <input {...register("rcsNumber")} className="input" />
            </Field>
            <div className="col-span-2">
              <Field
                label="Capital social (€)"
                error={errors.shareCapitalEuros?.message}
                required
              >
                <input
                  {...register("shareCapitalEuros")}
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                />
              </Field>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">TVA</h2>
        <Field label="Régime de TVA" error={errors.vatRegime?.message} required>
          <select {...register("vatRegime")} className="input">
            <option value="">— Choisir —</option>
            {Object.entries(VAT_REGIME_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        {vatNumberRequired && (
          <Field
            label="Numéro de TVA intracommunautaire"
            error={errors.vatNumber?.message}
            required
          >
            <input {...register("vatNumber")} className="input" />
          </Field>
        )}
        {vatRegime === "FRANCHISE_EN_BASE" && (
          <p className="text-sm text-gray-600">
            Tes factures porteront automatiquement la mention « TVA non
            applicable, art. 293B du CGI ».
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Adresse & contact</h2>
        <Field label="Adresse" error={errors.addressLine1?.message} required>
          <input {...register("addressLine1")} className="input" />
        </Field>
        <Field label="Complément d'adresse" error={errors.addressLine2?.message}>
          <input {...register("addressLine2")} className="input" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Code postal" error={errors.postalCode?.message} required>
            <input {...register("postalCode")} className="input" />
          </Field>
          <Field label="Ville" error={errors.city?.message} required>
            <input {...register("city")} className="input" />
          </Field>
        </div>
        <Field label="Email" error={errors.email?.message} required>
          <input {...register("email")} type="email" className="input" />
        </Field>
        <Field label="Téléphone" error={errors.phone?.message}>
          <input {...register("phone")} className="input" />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Coordonnées bancaires</h2>
        <Field label="IBAN" error={errors.iban?.message}>
          <input {...register("iban")} className="input" />
        </Field>
        <Field label="BIC" error={errors.bic?.message}>
          <input {...register("bic")} className="input" />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Conditions de règlement</h2>
        <Field
          label="Délai de paiement par défaut (jours)"
          error={errors.defaultPaymentTermsDays?.message}
          required
        >
          <input
            {...register("defaultPaymentTermsDays")}
            type="number"
            min="0"
            className="input"
          />
        </Field>
        <Field
          label="Relances automatiques (jours après l'échéance, séparés par des virgules)"
          error={errors.reminderOffsetsDays?.message ?? errors.reminderOffsetsDays?.root?.message}
        >
          <input
            {...register("reminderOffsetsDays", {
              setValueAs: (v) => (typeof v === "string" ? parseOffsetsInput(v) : v),
            })}
            className="input"
            placeholder="7, 15"
          />
        </Field>
        <p className="text-sm text-gray-600">
          Laissez vide pour désactiver les relances. Le mail est envoyé au client
          le matin du jour indiqué, tant que la facture n'est pas payée.
        </p>
        <p className="text-sm text-gray-600">
          Les pénalités de retard et l'indemnité forfaitaire de recouvrement
          de 40 € seront ajoutées automatiquement sur chaque facture, comme
          l'exige la loi entre professionnels.
        </p>
      </section>

      {serverError && (
        <p role="alert" className="text-sm text-red-600">
          {serverError}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-green-700">
          Profil enregistré.
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-brand-600 px-6 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {isSubmitting ? "Enregistrement…" : "Enregistrer le profil"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
      {error && (
        <span role="alert" className="mt-1 block text-sm text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

import { getCompanyAction } from "./actions";
import { CompanyForm } from "./CompanyForm";
import type { CompanyInput } from "@/lib/validation/company";

export default async function CompanyConfigurationPage() {
  const company = await getCompanyAction();

  const defaultValues: Partial<CompanyInput> = company
    ? {
        legalName: company.legalName,
        commercialName: company.commercialName ?? "",
        legalForm: company.legalForm,
        siren: company.siren,
        siret: company.siret,
        vatRegime: company.vatRegime,
        vatNumber: company.vatNumber ?? "",
        rcsCity: company.rcsCity ?? "",
        rcsNumber: company.rcsNumber ?? "",
        shareCapitalEuros:
          company.shareCapitalCents != null
            ? company.shareCapitalCents / 100
            : undefined,
        addressLine1: company.addressLine1,
        addressLine2: company.addressLine2 ?? "",
        postalCode: company.postalCode,
        city: company.city,
        country: company.country,
        email: company.email,
        phone: company.phone ?? "",
        iban: company.iban ?? "",
        bic: company.bic ?? "",
        defaultPaymentTermsDays: company.defaultPaymentTermsDays,
        reminderOffsetsDays: company.reminderOffsetsDays,
      }
    : {};

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Profil de l'entreprise</h1>
      <p className="mb-8 text-gray-600">
        Ces informations apparaîtront automatiquement sur tous tes devis et
        factures. Elles ne sont demandées qu'une seule fois.
      </p>
      <CompanyForm defaultValues={defaultValues} />
    </div>
  );
}

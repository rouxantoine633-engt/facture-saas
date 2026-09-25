import { z } from "zod";

const SIREN_REGEX = /^\d{9}$/;
const SIRET_REGEX = /^\d{14}$/;

const LEGAL_FORMS_WITH_RCS = ["EURL", "SARL", "SASU", "SAS"] as const;

export const companySchema = z
  .object({
    legalName: z.string().trim().min(1, "La raison sociale est obligatoire"),
    commercialName: z.string().trim().optional().or(z.literal("")),
    legalForm: z.enum([
      "AUTO_ENTREPRENEUR",
      "EI",
      "EURL",
      "SARL",
      "SASU",
      "SAS",
      "AUTRE",
    ]),

    siren: z
      .string()
      .trim()
      .regex(SIREN_REGEX, "Le SIREN doit contenir exactement 9 chiffres"),
    siret: z
      .string()
      .trim()
      .regex(SIRET_REGEX, "Le SIRET doit contenir exactement 14 chiffres"),

    vatRegime: z.enum(["FRANCHISE_EN_BASE", "REEL_SIMPLIFIE", "REEL_NORMAL"]),
    vatNumber: z.string().trim().optional().or(z.literal("")),

    rcsCity: z.string().trim().optional().or(z.literal("")),
    rcsNumber: z.string().trim().optional().or(z.literal("")),
    shareCapitalEuros: z.coerce.number().nonnegative().optional(),

    addressLine1: z.string().trim().min(1, "L'adresse est obligatoire"),
    addressLine2: z.string().trim().optional().or(z.literal("")),
    postalCode: z
      .string()
      .trim()
      .min(1, "Le code postal est obligatoire"),
    city: z.string().trim().min(1, "La ville est obligatoire"),
    country: z.string().trim().min(1).default("France"),

    email: z.string().trim().email("Adresse email invalide"),
    phone: z.string().trim().optional().or(z.literal("")),

    iban: z.string().trim().optional().or(z.literal("")),
    bic: z.string().trim().optional().or(z.literal("")),

    defaultPaymentTermsDays: z.coerce.number().int().min(0).max(365),
    reminderOffsetsDays: z
      .array(z.coerce.number().int().min(1))
      .default([7, 15]),
  })
  .superRefine((data, ctx) => {
    if (data.vatRegime !== "FRANCHISE_EN_BASE" && !data.vatNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["vatNumber"],
        message:
          "Le numéro de TVA intracommunautaire est obligatoire hors franchise en base",
      });
    }

    if (
      LEGAL_FORMS_WITH_RCS.includes(
        data.legalForm as (typeof LEGAL_FORMS_WITH_RCS)[number]
      )
    ) {
      if (!data.rcsCity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rcsCity"],
          message: "La ville du RCS est obligatoire pour cette forme juridique",
        });
      }
      if (!data.rcsNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rcsNumber"],
          message: "Le numéro RCS est obligatoire pour cette forme juridique",
        });
      }
      if (data.shareCapitalEuros === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["shareCapitalEuros"],
          message: "Le capital social est obligatoire pour cette forme juridique",
        });
      }
    }
  });

export type CompanyInput = z.infer<typeof companySchema>;

export const LEGAL_FORM_LABELS: Record<CompanyInput["legalForm"], string> = {
  AUTO_ENTREPRENEUR: "Auto-entrepreneur / Micro-entrepreneur",
  EI: "Entreprise Individuelle (EI)",
  EURL: "EURL",
  SARL: "SARL",
  SASU: "SASU",
  SAS: "SAS",
  AUTRE: "Autre",
};

export const VAT_REGIME_LABELS: Record<CompanyInput["vatRegime"], string> = {
  FRANCHISE_EN_BASE: "Franchise en base de TVA (art. 293B du CGI)",
  REEL_SIMPLIFIE: "Régime réel simplifié",
  REEL_NORMAL: "Régime réel normal",
};

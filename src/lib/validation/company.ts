import { z } from "zod";
import { normalizeHexColor } from "@/lib/pdf/colors";

const SIREN_REGEX = /^\d{9}$/;
const SIRET_REGEX = /^\d{14}$/;

const LEGAL_FORMS_WITH_RCS = ["EURL", "SARL", "SASU", "SAS"] as const;

/** Code NAF/APE : 4 chiffres et 1 lettre (« 6201Z »). Saisi avec ou sans point, en minuscules ou non. */
export function normalizeNafCode(value: string): string {
  return value.replace(/[.\s]/g, "").toUpperCase();
}
const NAF_REGEX = /^\d{4}[A-Z]$/;

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

    nafCode: z
      .string()
      .transform(normalizeNafCode)
      .refine((v) => v === "" || NAF_REGEX.test(v), {
        message: "Le code NAF/APE comporte 4 chiffres et 1 lettre (ex : 6201Z)",
      })
      .optional(),

    // Couleur principale des rapports PDF ; vide = couleur par défaut de l'application.
    brandColor: z
      .string()
      .trim()
      .refine((v) => v === "" || normalizeHexColor(v) !== null, { message: "La couleur doit être au format #RRGGBB" })
      .transform((v) => (v === "" ? "" : normalizeHexColor(v)!))
      .optional(),

    rcsCity: z.string().trim().optional().or(z.literal("")),
    rcsNumber: z.string().trim().optional().or(z.literal("")),
    rmCity: z.string().trim().optional().or(z.literal("")),
    rmNumber: z.string().trim().optional().or(z.literal("")),
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
      .array(
        z
          .number()
          .int()
          .min(1, "Un délai de relance doit être d'au moins 1 jour")
          .max(90, "Un délai de relance ne peut pas dépasser 90 jours")
      )
      .max(5, "5 relances au maximum")
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

    // Un numéro d'immatriculation n'a de sens qu'avec son greffe / sa chambre, et inversement.
    if (!!data.rcsCity !== !!data.rcsNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [data.rcsCity ? "rcsNumber" : "rcsCity"],
        message: "Indiquez à la fois la ville du greffe et le numéro RCS, ou aucun des deux",
      });
    }
    if (!!data.rmCity !== !!data.rmNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [data.rmCity ? "rmNumber" : "rmCity"],
        message: "Indiquez à la fois la chambre de métiers (ville) et le numéro du Répertoire des métiers, ou aucun des deux",
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
  AUTO_ENTREPRENEUR: "Entrepreneur individuel — micro-entrepreneur",
  EI: "Entrepreneur individuel (EI)",
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

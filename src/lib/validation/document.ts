import { z } from "zod";
import { FRENCH_VAT_RATES } from "@/lib/money";

export const ALLOWED_VAT_RATES: number[] = Object.values(FRENCH_VAT_RATES);

export const lineSchema = z.object({
  description: z.string().trim().min(1, "La description de chaque ligne est obligatoire"),
  quantity: z
    .string()
    .trim()
    .transform((v) => v.replace(",", "."))
    .refine((v) => /^\d+(\.\d{1,3})?$/.test(v) && Number(v) > 0, {
      message: "La quantité doit être un nombre supérieur à 0 (3 décimales maximum)",
    }),
  unitPriceCents: z
    .number()
    .int("Le prix unitaire est invalide")
    .min(0, "Le prix unitaire ne peut pas être négatif"),
  vatRatePer100000: z
    .number()
    .int()
    .refine((v) => ALLOWED_VAT_RATES.includes(v), { message: "Taux de TVA non reconnu" }),
});

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide");

export const quoteSchema = z.object({
  clientId: z.string().min(1, "Choisissez un client"),
  issueDate: dateString,
  validUntil: dateString.optional().or(z.literal("")),
  notes: z.string().trim().optional(),
  lines: z.array(lineSchema).min(1, "Ajoutez au moins une ligne au devis"),
});

export type QuoteInput = z.input<typeof quoteSchema>;

export const creditNoteSchema = z.object({
  invoiceId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(3, "Indiquez le motif de l'avoir (ex : erreur de prix, prestation annulée)")
    .max(500, "Le motif est trop long (500 caractères maximum)"),
  lines: z.array(lineSchema).min(1, "Ajoutez au moins une ligne à l'avoir"),
});

export type CreditNoteInput = z.input<typeof creditNoteSchema>;

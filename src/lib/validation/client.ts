import { z } from "zod";

export const clientSchema = z
  .object({
    type: z.enum(["INDIVIDUAL", "BUSINESS"]),
    name: z.string().trim().min(1, "Le nom du client est obligatoire"),
    siret: z.string().trim().optional(),
    vatNumber: z.string().trim().optional(),
    addressLine1: z.string().trim().min(1, "L'adresse du client est obligatoire"),
    postalCode: z.string().trim().min(1, "Le code postal est obligatoire"),
    city: z.string().trim().min(1, "La ville est obligatoire"),
    country: z.string().trim().min(1).default("France"),
    email: z.string().trim().email("Adresse email invalide").optional().or(z.literal("")),
    phone: z.string().trim().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.siret && !/^\d{14}$/.test(d.siret)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["siret"],
        message: "Le SIRET du client doit contenir 14 chiffres",
      });
    }
  });

export type ClientInput = z.infer<typeof clientSchema>;

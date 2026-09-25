import { z } from "zod";

// Politique de mot de passe volontairement simple à comprendre pour un
// public non technique, tout en écartant les mots de passe trop faibles.
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire"),
  email: z.string().trim().email("Adresse email invalide"),
  password: z
    .string()
    .min(10, "Le mot de passe doit contenir au moins 10 caractères"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est obligatoire"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

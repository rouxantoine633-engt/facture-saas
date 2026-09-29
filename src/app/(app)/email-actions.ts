"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DocumentError } from "@/lib/documents";
import { EmailError } from "@/lib/email/brevo";
import { sendDocumentByEmail } from "@/lib/email/send-document";
import { requireActiveCompany } from "@/lib/session";

const schema = z.object({
  kind: z.enum(["INVOICE", "QUOTE", "CREDIT_NOTE"]),
  documentId: z.string().min(1),
  to: z.string().trim().email("Adresse email du destinataire invalide"),
  message: z.string().trim().max(2000, "Le message est trop long (2000 caractères maximum)").optional(),
});

export async function sendDocumentEmailAction(input: z.input<typeof schema>): Promise<{ error?: string }> {
  const { company, userId } = await requireActiveCompany();

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };

  try {
    await sendDocumentByEmail({ company, userId, ...parsed.data });
  } catch (e) {
    if (e instanceof DocumentError || e instanceof EmailError) return { error: e.message };
    throw e;
  }

  const base = { INVOICE: "/factures", QUOTE: "/devis", CREDIT_NOTE: "/avoirs" }[parsed.data.kind];
  revalidatePath(`${base}/${parsed.data.documentId}`);
  return {};
}

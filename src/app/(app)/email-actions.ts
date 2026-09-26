"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DocumentError } from "@/lib/documents";
import { EmailError } from "@/lib/email/brevo";
import { sendDocumentByEmail } from "@/lib/email/send-document";
import { requireCompany } from "@/lib/session";

const schema = z.object({
  kind: z.enum(["INVOICE", "QUOTE"]),
  documentId: z.string().min(1),
  to: z.string().trim().email("Adresse email du destinataire invalide"),
  message: z.string().trim().max(2000, "Le message est trop long (2000 caractères maximum)").optional(),
});

export async function sendDocumentEmailAction(input: z.input<typeof schema>): Promise<{ error?: string }> {
  const { company, userId } = await requireCompany();

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };

  try {
    await sendDocumentByEmail({ company, userId, ...parsed.data });
  } catch (e) {
    if (e instanceof DocumentError || e instanceof EmailError) return { error: e.message };
    throw e;
  }

  revalidatePath(parsed.data.kind === "INVOICE" ? `/factures/${parsed.data.documentId}` : `/devis/${parsed.data.documentId}`);
  return {};
}

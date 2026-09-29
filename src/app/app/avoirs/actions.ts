"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCreditNote, DocumentError } from "@/lib/documents";
import { requireActiveCompany } from "@/lib/session";
import { creditNoteSchema, type CreditNoteInput } from "@/lib/validation/document";

export async function createCreditNoteAction(input: CreditNoteInput): Promise<{ error?: string }> {
  const { company, userId } = await requireActiveCompany();

  const parsed = creditNoteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };

  let creditNoteId: string;
  try {
    const note = await createCreditNote({
      companyId: company.id,
      invoiceId: parsed.data.invoiceId,
      reason: parsed.data.reason,
      lines: parsed.data.lines,
      userId,
    });
    creditNoteId = note.id;
  } catch (e) {
    if (e instanceof DocumentError) return { error: e.message };
    throw e;
  }

  revalidatePath("/app/avoirs");
  revalidatePath(`/app/factures/${parsed.data.invoiceId}`);
  redirect(`/app/avoirs/${creditNoteId}`);
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { convertQuoteToInvoice, createQuote, DocumentError, updateQuote } from "@/lib/documents";
import { requireCompany } from "@/lib/session";
import { quoteSchema, type QuoteInput } from "@/lib/validation/document";

export interface ActionResult {
  error?: string;
}

export async function createQuoteAction(input: QuoteInput): Promise<ActionResult> {
  const { company } = await requireCompany();

  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const d = parsed.data;

  // En franchise en base, aucune TVA n'est jamais appliquée, quoi que le navigateur envoie.
  const lines = d.lines.map((l) => ({
    ...l,
    vatRatePer100000: company.vatRegime === "FRANCHISE_EN_BASE" ? 0 : l.vatRatePer100000,
  }));

  let quoteId: string;
  try {
    const quote = await createQuote({
      companyId: company.id,
      clientId: d.clientId,
      issueDate: new Date(d.issueDate),
      validUntil: d.validUntil ? new Date(d.validUntil) : undefined,
      notes: d.notes || undefined,
      lines,
    });
    quoteId = quote.id;
  } catch (e) {
    if (e instanceof DocumentError) return { error: e.message };
    throw e;
  }

  revalidatePath("/devis");
  redirect(`/devis/${quoteId}`);
}

export async function updateQuoteAction(quoteId: string, input: QuoteInput): Promise<ActionResult> {
  const { company } = await requireCompany();

  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const d = parsed.data;

  const lines = d.lines.map((l) => ({
    ...l,
    vatRatePer100000: company.vatRegime === "FRANCHISE_EN_BASE" ? 0 : l.vatRatePer100000,
  }));

  try {
    await updateQuote({
      companyId: company.id,
      quoteId,
      clientId: d.clientId,
      issueDate: new Date(d.issueDate),
      validUntil: d.validUntil ? new Date(d.validUntil) : undefined,
      notes: d.notes || undefined,
      lines,
    });
  } catch (e) {
    if (e instanceof DocumentError) return { error: e.message };
    throw e;
  }

  revalidatePath("/devis");
  revalidatePath(`/devis/${quoteId}`);
  redirect(`/devis/${quoteId}`);
}

export async function convertQuoteAction(quoteId: string): Promise<ActionResult> {
  const { company } = await requireCompany();

  let invoiceId: string;
  try {
    const invoice = await convertQuoteToInvoice({ companyId: company.id, quoteId });
    invoiceId = invoice.id;
  } catch (e) {
    if (e instanceof DocumentError) return { error: e.message };
    throw e;
  }

  revalidatePath("/devis");
  revalidatePath("/factures");
  redirect(`/factures/${invoiceId}`);
}

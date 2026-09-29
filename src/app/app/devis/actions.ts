"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { QuoteStatus } from "@prisma/client";
import { convertQuoteToInvoice, createQuote, DocumentError, updateQuote, updateQuoteStatus } from "@/lib/documents";
import { requireActiveCompany } from "@/lib/session";
import { MANUAL_QUOTE_STATUSES } from "@/lib/quote-status";
import { quoteSchema, type QuoteInput } from "@/lib/validation/document";

export interface ActionResult {
  error?: string;
}

export async function createQuoteAction(input: QuoteInput): Promise<ActionResult> {
  const { company } = await requireActiveCompany();

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

  revalidatePath("/app/devis");
  redirect(`/app/devis/${quoteId}`);
}

export async function updateQuoteAction(quoteId: string, input: QuoteInput): Promise<ActionResult> {
  const { company } = await requireActiveCompany();

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

  revalidatePath("/app/devis");
  revalidatePath(`/app/devis/${quoteId}`);
  redirect(`/app/devis/${quoteId}`);
}

export async function updateQuoteStatusAction(quoteId: string, status: string): Promise<ActionResult> {
  const { company } = await requireActiveCompany();

  if (!MANUAL_QUOTE_STATUSES.includes(status as QuoteStatus)) {
    return { error: "Statut invalide." };
  }

  try {
    await updateQuoteStatus({ companyId: company.id, quoteId, status: status as QuoteStatus });
  } catch (e) {
    if (e instanceof DocumentError) return { error: e.message };
    throw e;
  }

  revalidatePath("/app/devis");
  revalidatePath(`/app/devis/${quoteId}`);
  return {};
}

export async function convertQuoteAction(quoteId: string): Promise<ActionResult> {
  const { company } = await requireActiveCompany();

  let invoiceId: string;
  try {
    const invoice = await convertQuoteToInvoice({ companyId: company.id, quoteId });
    invoiceId = invoice.id;
  } catch (e) {
    if (e instanceof DocumentError) return { error: e.message };
    throw e;
  }

  revalidatePath("/app/devis");
  revalidatePath("/app/factures");
  redirect(`/app/factures/${invoiceId}`);
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { deleteDraftInvoice, DocumentError, emitInvoice, recordPayment } from "@/lib/documents";
import { requireCompany } from "@/lib/session";
import { parseDecimalToScaledBigInt, MoneyError } from "@/lib/money";

export interface ActionResult {
  error?: string;
}

async function run(fn: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await fn();
    return {};
  } catch (e) {
    if (e instanceof DocumentError) return { error: e.message };
    // Le trigger SQL d'immutabilité est la dernière barrière : message clair pour l'utilisateur.
    if (e instanceof Error && e.message.includes("non modifiable")) {
      return { error: "Cette facture est verrouillée. Créez un avoir pour la corriger." };
    }
    throw e;
  }
}

export async function emitInvoiceAction(invoiceId: string): Promise<ActionResult> {
  const { company, userId } = await requireCompany();
  const result = await run(() => emitInvoice({ companyId: company.id, invoiceId, userId }));
  if (result.error) return result;
  revalidatePath("/factures");
  revalidatePath(`/factures/${invoiceId}`);
  return {};
}

export async function deleteDraftInvoiceAction(invoiceId: string): Promise<ActionResult> {
  const { company } = await requireCompany();
  const result = await run(() => deleteDraftInvoice({ companyId: company.id, invoiceId }));
  if (result.error) return result;
  revalidatePath("/factures");
  revalidatePath("/devis");
  redirect("/factures");
}

const PAYMENT_METHODS = ["VIREMENT", "CHEQUE", "ESPECES", "CARTE", "PRELEVEMENT", "AUTRE"] as const;

export interface RecordPaymentInput {
  invoiceId: string;
  amount: string; // saisie utilisateur en euros, ex "125,50"
  method: string;
  paidAt: string; // yyyy-mm-dd
  reference?: string;
}

export async function recordPaymentAction(input: RecordPaymentInput): Promise<ActionResult> {
  const { company } = await requireCompany();

  if (!PAYMENT_METHODS.includes(input.method as (typeof PAYMENT_METHODS)[number])) {
    return { error: "Moyen de paiement invalide." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.paidAt)) {
    return { error: "Date de paiement invalide." };
  }

  let amountCents: number;
  try {
    const cents = parseDecimalToScaledBigInt(input.amount.replace(",", ".").trim(), 2);
    if (cents <= 0n) return { error: "Le montant du paiement doit être supérieur à 0." };
    amountCents = Number(cents);
  } catch (e) {
    return { error: e instanceof MoneyError ? e.message : "Montant invalide." };
  }

  const result = await run(() =>
    recordPayment({
      companyId: company.id,
      invoiceId: input.invoiceId,
      amountCents,
      method: input.method as (typeof PAYMENT_METHODS)[number],
      paidAt: new Date(`${input.paidAt}T00:00:00.000Z`),
      reference: input.reference?.trim() || undefined,
    })
  );
  if (result.error) return result;
  revalidatePath("/factures");
  revalidatePath(`/factures/${input.invoiceId}`);
  return {};
}

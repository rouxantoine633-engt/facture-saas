"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { deleteDraftInvoice, DocumentError, emitInvoice, recordFullPayment } from "@/lib/documents";
import { requireCompany } from "@/lib/session";

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

export async function markPaidAction(invoiceId: string, method: string): Promise<ActionResult> {
  const { company } = await requireCompany();
  const allowed = ["VIREMENT", "CHEQUE", "ESPECES", "CARTE", "PRELEVEMENT", "AUTRE"] as const;
  if (!allowed.includes(method as (typeof allowed)[number])) return { error: "Moyen de paiement invalide." };

  const result = await run(() =>
    recordFullPayment({
      companyId: company.id,
      invoiceId,
      method: method as (typeof allowed)[number],
      paidAt: new Date(),
    })
  );
  if (result.error) return result;
  revalidatePath("/factures");
  revalidatePath(`/factures/${invoiceId}`);
  return {};
}

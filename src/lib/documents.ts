import { randomUUID } from "crypto";
import type { Client, Company, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeLineTotals, summarizeDocument } from "@/lib/money";
import { allocateDocumentNumber } from "@/lib/numbering";
import {
  validateInvoiceForEmission,
  type BuyerSnapshot,
  type SellerSnapshot,
} from "@/lib/invoice-compliance";

export class DocumentError extends Error {}

export interface LineDraft {
  description: string;
  quantity: string;
  unitPriceCents: number;
  vatRatePer100000: number;
}

export function sellerSnapshotFromCompany(c: Company): SellerSnapshot {
  return {
    legalName: c.legalName,
    legalForm: c.legalForm,
    siren: c.siren,
    siret: c.siret,
    vatRegime: c.vatRegime,
    vatNumber: c.vatNumber,
    rcsCity: c.rcsCity,
    rcsNumber: c.rcsNumber,
    shareCapitalCents: c.shareCapitalCents,
    addressLine1: c.addressLine1,
    postalCode: c.postalCode,
    city: c.city,
    country: c.country,
    email: c.email,
  };
}

export function buyerSnapshotFromClient(c: Client): BuyerSnapshot {
  return {
    type: c.type,
    name: c.name,
    addressLine1: c.addressLine1,
    postalCode: c.postalCode,
    city: c.city,
    country: c.country,
    siret: c.siret,
    vatNumber: c.vatNumber,
  };
}

export function computeDocumentLines(lines: LineDraft[]) {
  const computed = lines.map((line, index) => {
    const totals = computeLineTotals(line);
    return {
      position: index + 1,
      description: line.description.trim(),
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      vatRatePer100000: line.vatRatePer100000,
      ...totals,
    };
  });
  return { lines: computed, totals: summarizeDocument(computed) };
}

/** Une facture n'est modifiable/supprimable que tant qu'elle est brouillon. */
export function assertInvoiceMutable(invoice: { status: string }) {
  if (invoice.status !== "DRAFT") {
    throw new DocumentError(
      "Cette facture a déjà été émise : elle ne peut plus être modifiée ni supprimée. Créez un avoir pour la corriger."
    );
  }
}

export async function createQuote(params: {
  companyId: string;
  clientId: string;
  issueDate: Date;
  validUntil?: Date;
  notes?: string;
  lines: LineDraft[];
}) {
  const { lines, totals } = computeDocumentLines(params.lines);
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.findFirst({
      where: { id: params.clientId, companyId: params.companyId },
    });
    if (!client) throw new DocumentError("Client introuvable.");

    const number = await allocateDocumentNumber(tx, {
      companyId: params.companyId,
      type: "QUOTE",
      date: params.issueDate,
    });
    return tx.quote.create({
      data: {
        companyId: params.companyId,
        clientId: params.clientId,
        number,
        issueDate: params.issueDate,
        validUntil: params.validUntil,
        notes: params.notes,
        subtotalHtCents: totals.subtotalHtCents,
        totalVatCents: totals.totalVatCents,
        totalTtcCents: totals.totalTtcCents,
        lines: { create: lines },
      },
    });
  });
}

/** Crée une facture BROUILLON à partir d'un devis et verrouille le devis. */
export async function convertQuoteToInvoice(params: { companyId: string; quoteId: string }) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findFirst({
      where: { id: params.quoteId, companyId: params.companyId },
      include: { lines: { orderBy: { position: "asc" } }, company: true },
    });
    if (!quote) throw new DocumentError("Devis introuvable.");
    if (quote.status === "CONVERTED") throw new DocumentError("Ce devis a déjà été converti en facture.");
    if (quote.status === "REJECTED" || quote.status === "EXPIRED") {
      throw new DocumentError("Ce devis refusé ou expiré ne peut pas être converti.");
    }

    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setUTCDate(dueDate.getUTCDate() + quote.company.defaultPaymentTermsDays);

    const invoice = await tx.invoice.create({
      data: {
        companyId: quote.companyId,
        clientId: quote.clientId,
        // Numéro provisoire : le vrai numéro légal n'est attribué qu'à l'émission.
        number: `BROUILLON-${randomUUID()}`,
        issueDate,
        dueDate,
        originQuoteNumber: quote.number,
        originQuoteDate: quote.issueDate,
        subtotalHtCents: quote.subtotalHtCents,
        totalVatCents: quote.totalVatCents,
        totalTtcCents: quote.totalTtcCents,
        lines: {
          create: quote.lines.map((l) => ({
            position: l.position,
            description: l.description,
            quantity: l.quantity,
            unitPriceCents: l.unitPriceCents,
            vatRatePer100000: l.vatRatePer100000,
            lineHtCents: l.lineHtCents,
            lineVatCents: l.lineVatCents,
            lineTtcCents: l.lineTtcCents,
          })),
        },
      },
    });
    await tx.quote.update({
      where: { id: quote.id },
      data: { status: "CONVERTED", convertedInvoiceId: invoice.id },
    });
    return invoice;
  });
}

/**
 * Émet une facture : contrôle de conformité, attribution du numéro légal,
 * figement des mentions (snapshots) et verrouillage. Irréversible.
 */
export async function emitInvoice(params: { companyId: string; invoiceId: string; userId?: string }) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: params.invoiceId, companyId: params.companyId },
      include: { lines: { orderBy: { position: "asc" } }, client: true, company: true },
    });
    if (!invoice) throw new DocumentError("Facture introuvable.");
    assertInvoiceMutable(invoice);

    const { lines, totals } = computeDocumentLines(
      invoice.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity.toString(),
        unitPriceCents: l.unitPriceCents,
        vatRatePer100000: l.vatRatePer100000,
      }))
    );

    const seller = sellerSnapshotFromCompany(invoice.company);
    const buyer = buyerSnapshotFromClient(invoice.client);
    const problems = validateInvoiceForEmission({
      seller,
      buyer,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      lines,
      latePenaltyRateText: invoice.company.latePenaltyRateText,
      recoveryIndemnityCents: invoice.company.recoveryIndemnityCents,
      discountPolicyText: invoice.company.discountPolicyText,
    });
    if (problems.length > 0) {
      throw new DocumentError(`Facture incomplète :\n- ${problems.join("\n- ")}`);
    }

    const number = await allocateDocumentNumber(tx, {
      companyId: params.companyId,
      type: "INVOICE",
      date: invoice.issueDate,
    });

    // Les lignes sont réécrites tant que la facture est encore brouillon
    // (le trigger SQL interdit toute écriture de ligne après émission).
    await tx.invoiceLine.deleteMany({ where: { invoiceId: invoice.id } });
    await tx.invoiceLine.createMany({
      data: lines.map((l) => ({ ...l, invoiceId: invoice.id })),
    });
    const emitted = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        number,
        status: "SENT",
        emittedAt: new Date(),
        subtotalHtCents: totals.subtotalHtCents,
        totalVatCents: totals.totalVatCents,
        totalTtcCents: totals.totalTtcCents,
        sellerLegalSnapshot: seller as unknown as Prisma.InputJsonValue,
        buyerLegalSnapshot: buyer as unknown as Prisma.InputJsonValue,
        latePenaltyRateText: invoice.company.latePenaltyRateText,
        recoveryIndemnityCents: invoice.company.recoveryIndemnityCents,
        discountPolicyText: invoice.company.discountPolicyText,
      },
    });
    await tx.auditLog.create({
      data: {
        companyId: params.companyId,
        userId: params.userId,
        action: "invoice.emit",
        entityType: "Invoice",
        entityId: invoice.id,
        metadata: { number },
      },
    });
    return emitted;
  });
}

/** Supprime un brouillon (jamais une facture émise) et rouvre le devis d'origine. */
export async function deleteDraftInvoice(params: { companyId: string; invoiceId: string }) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: params.invoiceId, companyId: params.companyId },
    });
    if (!invoice) throw new DocumentError("Facture introuvable.");
    assertInvoiceMutable(invoice);

    await tx.quote.updateMany({
      where: { convertedInvoiceId: invoice.id },
      data: { status: "ACCEPTED", convertedInvoiceId: null },
    });
    await tx.invoice.delete({ where: { id: invoice.id } });
  });
}

/** Enregistre le règlement du solde restant et passe la facture en « payée ». */
export async function recordFullPayment(params: {
  companyId: string;
  invoiceId: string;
  method: "VIREMENT" | "CHEQUE" | "ESPECES" | "CARTE" | "PRELEVEMENT" | "AUTRE";
  paidAt: Date;
}) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: params.invoiceId, companyId: params.companyId },
      include: { payments: true },
    });
    if (!invoice) throw new DocumentError("Facture introuvable.");
    if (invoice.status === "DRAFT") throw new DocumentError("Émettez d'abord la facture avant d'enregistrer un paiement.");
    if (invoice.status === "PAID") throw new DocumentError("Cette facture est déjà payée.");

    const alreadyPaid = invoice.payments.reduce((sum, p) => sum + p.amountCents, 0);
    const remaining = invoice.totalTtcCents - alreadyPaid;
    if (remaining <= 0) throw new DocumentError("Il ne reste rien à payer sur cette facture.");

    await tx.payment.create({
      data: { invoiceId: invoice.id, amountCents: remaining, paidAt: params.paidAt, method: params.method },
    });
    await tx.invoice.update({ where: { id: invoice.id }, data: { status: "PAID" } });
  });
}

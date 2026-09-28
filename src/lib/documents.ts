import { randomUUID } from "crypto";
import type { Client, Company, Prisma, QuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeLineTotals, formatCentsToEuros, summarizeDocument } from "@/lib/money";
import { allocateDocumentNumber } from "@/lib/numbering";
import { amountStillDue, statusAfterCreditNote, validateCreditNote } from "@/lib/credit-notes";
import { canSetQuoteStatus } from "@/lib/quote-status";
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
    iban: c.iban,
    bic: c.bic,
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

/**
 * Modifie un devis, uniquement tant qu'il est encore brouillon. Une fois
 * envoyé, accepté ou converti, il ne peut plus être modifié directement
 * (cohérent avec la trace qu'en garde le client) — il faut en créer un nouveau.
 */
/** Change manuellement le statut d'un devis (envoyé/accepté/refusé/expiré). */
export async function updateQuoteStatus(params: { companyId: string; quoteId: string; status: QuoteStatus }) {
  const quote = await prisma.quote.findFirst({ where: { id: params.quoteId, companyId: params.companyId } });
  if (!quote) throw new DocumentError("Devis introuvable.");
  if (!canSetQuoteStatus(quote.status, params.status)) {
    throw new DocumentError(
      quote.status === "CONVERTED"
        ? "Ce devis a été converti en facture : son statut ne peut plus être modifié."
        : "Statut invalide."
    );
  }
  return prisma.quote.update({ where: { id: quote.id }, data: { status: params.status } });
}

export async function updateQuote(params: {
  companyId: string;
  quoteId: string;
  clientId: string;
  issueDate: Date;
  validUntil?: Date;
  notes?: string;
  lines: LineDraft[];
}) {
  const { lines, totals } = computeDocumentLines(params.lines);
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findFirst({ where: { id: params.quoteId, companyId: params.companyId } });
    if (!quote) throw new DocumentError("Devis introuvable.");
    if (quote.status !== "DRAFT") {
      throw new DocumentError("Ce devis n'est plus un brouillon et ne peut plus être modifié.");
    }
    const client = await tx.client.findFirst({ where: { id: params.clientId, companyId: params.companyId } });
    if (!client) throw new DocumentError("Client introuvable.");

    await tx.quoteLine.deleteMany({ where: { quoteId: quote.id } });
    return tx.quote.update({
      where: { id: quote.id },
      data: {
        clientId: params.clientId,
        issueDate: params.issueDate,
        validUntil: params.validUntil ?? null,
        notes: params.notes ?? null,
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

/**
 * Enregistre un paiement (total ou partiel). Passe la facture en « payée »
 * si le solde restant tombe à zéro, sinon en « partiellement payée ».
 */
export async function recordPayment(params: {
  companyId: string;
  invoiceId: string;
  amountCents: number;
  method: "VIREMENT" | "CHEQUE" | "ESPECES" | "CARTE" | "PRELEVEMENT" | "AUTRE";
  paidAt: Date;
  reference?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: params.invoiceId, companyId: params.companyId },
      include: { payments: true },
    });
    if (!invoice) throw new DocumentError("Facture introuvable.");
    if (invoice.status === "DRAFT") throw new DocumentError("Émettez d'abord la facture avant d'enregistrer un paiement.");
    if (invoice.status === "PAID") throw new DocumentError("Cette facture est déjà payée.");
    if (invoice.status === "CANCELLED_BY_CREDIT_NOTE") {
      throw new DocumentError("Cette facture a été annulée par un avoir.");
    }
    if (!Number.isInteger(params.amountCents) || params.amountCents <= 0) {
      throw new DocumentError("Le montant du paiement doit être supérieur à 0.");
    }

    const alreadyPaid = invoice.payments.reduce((sum, p) => sum + p.amountCents, 0);
    const credits = await tx.creditNote.aggregate({ where: { invoiceId: invoice.id }, _sum: { totalTtcCents: true } });
    const creditedCents = credits._sum.totalTtcCents ?? 0;
    const remaining = amountStillDue({ totalTtcCents: invoice.totalTtcCents, paidCents: alreadyPaid, creditedTtcCents: creditedCents });
    if (remaining <= 0) throw new DocumentError("Il ne reste rien à payer sur cette facture.");
    if (params.amountCents > remaining) {
      throw new DocumentError(
        `Le montant saisi (${formatCentsToEuros(params.amountCents)}) dépasse le solde restant dû (${formatCentsToEuros(remaining)}).`
      );
    }

    await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amountCents: params.amountCents,
        paidAt: params.paidAt,
        method: params.method,
        reference: params.reference || null,
      },
    });

    const stillDueAfter = remaining - params.amountCents;
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: stillDueAfter <= 0 ? "PAID" : "PARTIALLY_PAID" },
    });
  });
}

/**
 * Émet un avoir sur une facture déjà émise : seul moyen légal de la corriger.
 * L'avoir reprend les mentions vendeur/client figées de la facture d'origine,
 * reçoit son propre numéro chronologique et est immuable dès sa création.
 */
export async function createCreditNote(params: {
  companyId: string;
  invoiceId: string;
  reason: string;
  lines: LineDraft[];
  userId?: string;
}) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Verrou sur la facture : deux avoirs simultanés ne peuvent pas dépasser ensemble son total.
    await tx.$queryRaw`SELECT "id" FROM "invoices" WHERE "id" = ${params.invoiceId} AND "companyId" = ${params.companyId} FOR UPDATE`;

    const invoice = await tx.invoice.findFirst({
      where: { id: params.invoiceId, companyId: params.companyId },
      include: { company: true, payments: true },
    });
    if (!invoice) throw new DocumentError("Facture introuvable.");
    if (invoice.status === "DRAFT") {
      throw new DocumentError("Un brouillon se modifie directement : un avoir ne concerne que les factures émises.");
    }
    if (!invoice.sellerLegalSnapshot || !invoice.buyerLegalSnapshot) {
      throw new DocumentError("Mentions légales de la facture manquantes.");
    }

    const franchise = invoice.company.vatRegime === "FRANCHISE_EN_BASE";
    const { lines, totals } = computeDocumentLines(
      params.lines.map((l) => ({ ...l, vatRatePer100000: franchise ? 0 : l.vatRatePer100000 }))
    );

    const credited = await tx.creditNote.aggregate({ where: { invoiceId: invoice.id }, _sum: { totalTtcCents: true } });
    const alreadyCredited = credited._sum.totalTtcCents ?? 0;

    const problems = validateCreditNote({
      reason: params.reason,
      lineCount: lines.length,
      newTotalTtcCents: totals.totalTtcCents,
      invoiceTotalTtcCents: invoice.totalTtcCents,
      alreadyCreditedTtcCents: alreadyCredited,
    });
    if (problems.length > 0) throw new DocumentError(problems.join("\n"));

    const issueDate = new Date();
    const number = await allocateDocumentNumber(tx, {
      companyId: params.companyId,
      type: "CREDIT_NOTE",
      date: issueDate,
    });

    const creditNote = await tx.creditNote.create({
      data: {
        companyId: params.companyId,
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        number,
        reason: params.reason.trim(),
        issueDate,
        subtotalHtCents: totals.subtotalHtCents,
        totalVatCents: totals.totalVatCents,
        totalTtcCents: totals.totalTtcCents,
        sellerLegalSnapshot: invoice.sellerLegalSnapshot as Prisma.InputJsonValue,
        buyerLegalSnapshot: invoice.buyerLegalSnapshot as Prisma.InputJsonValue,
        lines: { create: lines },
      },
    });

    const nextStatus = statusAfterCreditNote({
      current: invoice.status,
      totalTtcCents: invoice.totalTtcCents,
      creditedTtcCents: alreadyCredited + totals.totalTtcCents,
      paidCents: invoice.payments.reduce((sum, p) => sum + p.amountCents, 0),
    });
    if (nextStatus !== invoice.status) {
      await tx.invoice.update({ where: { id: invoice.id }, data: { status: nextStatus } });
    }

    await tx.auditLog.create({
      data: {
        companyId: params.companyId,
        userId: params.userId,
        action: "credit_note.emit",
        entityType: "CreditNote",
        entityId: creditNote.id,
        metadata: { number, invoiceNumber: invoice.number, totalTtcCents: totals.totalTtcCents },
      },
    });
    return creditNote;
  });
}

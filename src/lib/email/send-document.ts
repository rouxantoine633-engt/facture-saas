import type { Company } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DocumentError } from "@/lib/documents";
import { formatEurosForPdf } from "@/lib/pdf/format";
import { loadInvoicePdf, loadQuotePdf } from "@/lib/pdf/load";
import { renderPdfBuffer } from "@/lib/pdf/render";
import { sendEmail } from "./brevo";
import { buildDocumentEmail } from "./templates";

/** Plafond quotidien par entreprise : limite l'usage de la plateforme comme relais de spam. */
export const DAILY_EMAIL_LIMIT = 20;

export async function sendDocumentByEmail(params: {
  company: Company;
  userId: string;
  kind: "INVOICE" | "QUOTE";
  documentId: string;
  to: string;
  message?: string;
}): Promise<void> {
  const { company, kind, documentId } = params;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sentToday = await prisma.auditLog.count({
    where: { companyId: company.id, action: { startsWith: "email." }, createdAt: { gte: since } },
  });
  if (sentToday >= DAILY_EMAIL_LIMIT) {
    throw new DocumentError(`Limite de ${DAILY_EMAIL_LIMIT} emails par jour atteinte. Réessayez demain.`);
  }

  if (kind === "INVOICE") {
    const invoice = await prisma.invoice.findFirst({ where: { id: documentId, companyId: company.id } });
    if (!invoice) throw new DocumentError("Facture introuvable.");
    if (invoice.status === "DRAFT") {
      throw new DocumentError("Émettez la facture avant de l'envoyer : un brouillon n'a pas de numéro définitif.");
    }
  }

  const loaded = kind === "INVOICE" ? await loadInvoicePdf(company, documentId) : await loadQuotePdf(company, documentId);
  if (!loaded) throw new DocumentError("Document introuvable.");
  const { data, filename } = loaded;

  const mail = buildDocumentEmail({
    kind,
    companyName: company.commercialName || company.legalName,
    clientName: data.clientName,
    number: data.number,
    totalTtcLabel: formatEurosForPdf(data.totals.totalTtcCents),
    dueDateLabel: data.dueDateLabel,
    validUntilLabel: data.validUntilLabel,
    customMessage: params.message,
  });

  const pdf = await renderPdfBuffer(data);
  const { messageId } = await sendEmail({
    to: { email: params.to },
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    senderName: company.commercialName || company.legalName,
    replyTo: { email: company.email, name: company.legalName },
    attachments: [{ name: filename, content: pdf }],
  });

  // Journal d'audit plutôt qu'une colonne sur la facture : une facture émise est immuable en base.
  await prisma.$transaction(async (tx) => {
    await tx.auditLog.create({
      data: {
        companyId: company.id,
        userId: params.userId,
        action: kind === "INVOICE" ? "email.invoice_sent" : "email.quote_sent",
        entityType: kind === "INVOICE" ? "Invoice" : "Quote",
        entityId: documentId,
        metadata: { to: params.to, messageId, number: data.number },
      },
    });
    if (kind === "QUOTE") {
      await tx.quote.updateMany({ where: { id: documentId, status: "DRAFT" }, data: { status: "SENT" } });
    }
  });
}

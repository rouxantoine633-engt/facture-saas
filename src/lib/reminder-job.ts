import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { startOfUtcDay } from "@/lib/dates";
import { formatDate } from "@/lib/labels";
import { EmailError, sendEmail } from "@/lib/email/brevo";
import { buildReminderEmail } from "@/lib/email/templates";
import { loadInvoicePdf } from "@/lib/pdf/load";
import { formatEurosForPdf } from "@/lib/pdf/format";
import { renderPdfBuffer } from "@/lib/pdf/render";
import { amountStillDue } from "@/lib/credit-notes";
import { isFirmReminder, planReminders, type ExistingReminder } from "@/lib/reminders";

const MAX_INVOICES_PER_RUN = 200;
const STALE_PENDING_MS = 60 * 60 * 1000;

export interface ReminderJobSummary {
  markedOverdue: number;
  sent: number;
  failed: number;
  skippedNoEmail: number;
  cancelled: number;
}

/** Tâche quotidienne : passe les factures échues en « en retard » puis envoie les relances dues. */
export async function runReminderJob(now: Date = new Date()): Promise<ReminderJobSummary> {
  const summary: ReminderJobSummary = { markedOverdue: 0, sent: 0, failed: 0, skippedNoEmail: 0, cancelled: 0 };

  const overdue = await prisma.invoice.updateMany({
    where: { status: { in: ["SENT", "PARTIALLY_PAID"] }, dueDate: { lt: startOfUtcDay(now) } },
    data: { status: "OVERDUE" },
  });
  summary.markedOverdue = overdue.count;

  const invoices = await prisma.invoice.findMany({
    where: { status: "OVERDUE", company: { reminderOffsetsDays: { isEmpty: false } } },
    include: { company: true, client: true, payments: true, reminders: true, creditNotes: true },
    orderBy: { dueDate: "asc" },
    take: MAX_INVOICES_PER_RUN,
  });

  for (const invoice of invoices) {
    const existing: ExistingReminder[] = [];
    for (const r of invoice.reminders) {
      const staleRetryable = r.status === "PENDING" && now.getTime() - r.createdAt.getTime() > STALE_PENDING_MS;
      if (r.status === "SENT" || r.status === "CANCELLED") existing.push({ offsetDays: r.offsetDays, status: r.status });
      else if (r.status === "FAILED" || staleRetryable) existing.push({ offsetDays: r.offsetDays, status: "FAILED" });
      else existing.push({ offsetDays: r.offsetDays, status: "SENT" }); // envoi en cours : ne pas doubler
    }

    const plan = planReminders({
      dueDate: invoice.dueDate,
      offsetsDays: invoice.company.reminderOffsetsDays,
      existing,
      now,
    });

    for (const offsetDays of plan.toCancel) {
      await prisma.reminder.upsert({
        where: { invoiceId_offsetDays: { invoiceId: invoice.id, offsetDays } },
        create: { invoiceId: invoice.id, offsetDays, scheduledFor: now, status: "CANCELLED" },
        update: { status: "CANCELLED" },
      });
      summary.cancelled++;
    }
    if (plan.toSend === null) continue;

    if (stillDue(invoice) <= 0) continue; // soldée par des avoirs entre-temps

    if (!invoice.client.email) {
      summary.skippedNoEmail++;
      continue;
    }

    // Réservation : la contrainte d'unicité (facture, palier) empêche un double envoi si deux exécutions se chevauchent.
    const claimed = await claimReminder(invoice.id, plan.toSend, now);
    if (!claimed) continue;

    try {
      await sendReminder(invoice, plan.toSend);
      await prisma.reminder.update({
        where: { invoiceId_offsetDays: { invoiceId: invoice.id, offsetDays: plan.toSend } },
        data: { status: "SENT", sentAt: new Date() },
      });
      summary.sent++;
    } catch (e) {
      if (!(e instanceof EmailError)) console.error("Relance : erreur inattendue", invoice.id, e);
      await prisma.reminder.update({
        where: { invoiceId_offsetDays: { invoiceId: invoice.id, offsetDays: plan.toSend } },
        data: { status: "FAILED" },
      });
      summary.failed++;
    }
  }

  return summary;
}

async function claimReminder(invoiceId: string, offsetDays: number, now: Date): Promise<boolean> {
  const row = await prisma.reminder.findUnique({ where: { invoiceId_offsetDays: { invoiceId, offsetDays } } });
  if (!row) {
    try {
      await prisma.reminder.create({ data: { invoiceId, offsetDays, scheduledFor: now, status: "PENDING" } });
      return true;
    } catch {
      return false; // créé entre-temps par une autre exécution
    }
  }
  const claim = await prisma.reminder.updateMany({
    where: {
      id: row.id,
      OR: [{ status: "FAILED" }, { status: "PENDING", createdAt: { lt: new Date(now.getTime() - STALE_PENDING_MS) } }],
    },
    data: { status: "PENDING", createdAt: now },
  });
  return claim.count === 1;
}

type InvoiceForReminder = Prisma.InvoiceGetPayload<{
  include: { company: true; client: true; payments: true; reminders: true; creditNotes: true };
}>;

async function sendReminder(invoice: InvoiceForReminder, offsetDays: number): Promise<void> {
  const { company, client } = invoice;
  const remaining = stillDue(invoice);

  const loaded = await loadInvoicePdf(company, invoice.id);
  if (!loaded) throw new EmailError("Facture introuvable pour la relance");

  const mail = buildReminderEmail({
    companyName: company.commercialName || company.legalName,
    clientName: client.name,
    number: invoice.number,
    amountDueLabel: formatEurosForPdf(remaining),
    dueDateLabel: formatDate(invoice.dueDate),
    firm: isFirmReminder(offsetDays, company.reminderOffsetsDays),
    businessClient: client.type === "BUSINESS",
    recoveryIndemnityLabel: formatEurosForPdf(company.recoveryIndemnityCents),
  });

  await sendEmail({
    to: { email: client.email as string },
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    senderName: company.commercialName || company.legalName,
    replyTo: { email: company.email, name: company.legalName },
    attachments: [{ name: loaded.filename, content: await renderPdfBuffer(loaded.data) }],
  });
}

function stillDue(invoice: InvoiceForReminder): number {
  return amountStillDue({
    totalTtcCents: invoice.totalTtcCents,
    paidCents: invoice.payments.reduce((sum, p) => sum + p.amountCents, 0),
    creditedTtcCents: invoice.creditNotes.reduce((sum, c) => sum + c.totalTtcCents, 0),
  });
}

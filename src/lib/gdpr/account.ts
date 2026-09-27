import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  anonymizedEmailFor,
  ANONYMIZED_CLIENT_NAME,
  ANONYMIZED_COMPANY_NAME,
  pickDeletionStrategy,
  redactAuditMetadata,
  type DeletionStrategy,
} from "./deletion";

export interface DeletionPreview {
  strategy: DeletionStrategy;
  emittedInvoices: number;
  creditNotes: number;
}

export async function previewAccountDeletion(companyId: string): Promise<DeletionPreview> {
  const [emittedInvoices, creditNotes] = await Promise.all([
    prisma.invoice.count({ where: { companyId, status: { not: "DRAFT" } } }),
    prisma.creditNote.count({ where: { companyId } }),
  ]);
  return { strategy: pickDeletionStrategy({ emittedInvoices, creditNotes }), emittedInvoices, creditNotes };
}

/**
 * Ferme le compte : suppression totale si rien n'a jamais été émis, sinon
 * anonymisation (voir `pickDeletionStrategy`). Le mot de passe est retiré et
 * toutes les sessions/comptes OAuth sont révoqués dans les deux cas ; c'est
 * à l'appelant de terminer la session (déconnexion) juste après.
 */
export async function closeAccount(params: { userId: string; companyId: string | null }): Promise<DeletionPreview> {
  const { userId, companyId } = params;

  if (!companyId) {
    // Aucune entreprise créée : rien à protéger, suppression immédiate.
    await prisma.user.delete({ where: { id: userId } });
    return { strategy: "HARD_DELETE", emittedInvoices: 0, creditNotes: 0 };
  }

  const preview = await previewAccountDeletion(companyId);

  if (preview.strategy === "HARD_DELETE") {
    // Cascade Prisma/DB : Company -> Client, Quote(+lignes), Invoice brouillon
    // (+lignes), DocumentCounter, AuditLog. Aucune facture émise à protéger.
    await prisma.user.delete({ where: { id: userId } });
    return preview;
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Ce qui n'a aucune obligation de conservation légale disparaît entièrement.
    await tx.invoice.deleteMany({ where: { companyId, status: "DRAFT" } });
    await tx.quote.deleteMany({ where: { companyId } });

    // 2. Clients non référencés par un document légalement conservé : effacés.
    //    Les autres sont anonymisés (l'affichage des factures/avoirs émis repose
    //    sur leurs mentions figées à l'émission, pas sur la fiche client).
    const [invoiceClients, creditNoteClients] = await Promise.all([
      tx.invoice.findMany({ where: { companyId }, select: { clientId: true }, distinct: ["clientId"] }),
      tx.creditNote.findMany({ where: { companyId }, select: { clientId: true }, distinct: ["clientId"] }),
    ]);
    const protectedClientIds = [...new Set([...invoiceClients, ...creditNoteClients].map((c) => c.clientId))];

    await tx.client.deleteMany({ where: { companyId, id: { notIn: protectedClientIds } } });
    if (protectedClientIds.length > 0) {
      await tx.client.updateMany({
        where: { companyId, id: { in: protectedClientIds } },
        data: {
          name: ANONYMIZED_CLIENT_NAME,
          siret: null,
          vatNumber: null,
          addressLine1: "",
          addressLine2: null,
          postalCode: "",
          city: "",
          email: null,
          phone: null,
          notes: null,
        },
      });
    }

    // 3. L'entreprise devient un tombstone : les FK (factures, avoirs) restent
    //    valides, mais plus aucune donnée personnelle exploitable.
    await tx.company.update({
      where: { id: companyId },
      data: {
        legalName: ANONYMIZED_COMPANY_NAME,
        commercialName: null,
        addressLine1: "",
        addressLine2: null,
        postalCode: "",
        city: "",
        email: anonymizedEmailFor(userId),
        phone: null,
        iban: null,
        bic: null,
        logoUrl: null,
      },
    });

    // 4. Le journal d'audit garde la trace des actions (numérotation, émissions)
    //    mais plus aucune adresse email ni référence à l'utilisateur.
    const logs = await tx.auditLog.findMany({ where: { companyId }, select: { id: true, metadata: true } });
    for (const log of logs) {
      await tx.auditLog.update({
        where: { id: log.id },
        data: { userId: null, metadata: redactAuditMetadata(log.metadata) as Prisma.InputJsonValue },
      });
    }
    await tx.auditLog.create({
      data: { companyId, action: "account.anonymized", entityType: "Company", entityId: companyId },
    });

    // 5. Le compte utilisateur ne peut plus se reconnecter ; les sessions et
    //    liaisons OAuth actives sont révoquées.
    await tx.session.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });
    await tx.user.update({
      where: { id: userId },
      data: { email: anonymizedEmailFor(userId), name: null, passwordHash: null },
    });
  });

  return preview;
}

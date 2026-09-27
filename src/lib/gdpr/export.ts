import { prisma } from "@/lib/prisma";

/**
 * Export de portabilité (RGPD art. 15 et 20) : l'intégralité des données que
 * l'utilisateur a saisies ou qui le concernent, dans un format lisible par
 * machine. Ce n'est pas le PDF légal des documents (voir /factures/[id]/pdf).
 */
export async function buildPersonalDataExport(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const company = await prisma.company.findUnique({
    where: { ownerId: userId },
    include: {
      clients: true,
      quotes: { include: { lines: true } },
      invoices: { include: { lines: true, payments: true, reminders: true } },
      creditNotes: { include: { lines: true } },
      auditLogs: { orderBy: { createdAt: "asc" } },
    },
  });

  return {
    exportedAt: new Date().toISOString(),
    format: "facture-saas.personal-data-export.v1",
    user,
    company,
  };
}

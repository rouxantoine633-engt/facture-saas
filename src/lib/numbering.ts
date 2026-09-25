import type { DocumentType, Prisma } from "@prisma/client";

export const DEFAULT_PREFIXES: Record<DocumentType, string> = {
  QUOTE: "DEV",
  INVOICE: "F",
  CREDIT_NOTE: "AV",
};

export function formatDocumentNumber(params: {
  prefix: string;
  sequence: number;
  year?: number;
}): string {
  const { prefix, sequence, year } = params;
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error("Le numéro de séquence doit être un entier positif");
  }
  return year !== undefined
    ? `${prefix}-${year}-${String(sequence).padStart(4, "0")}`
    : `${prefix}-${String(sequence).padStart(5, "0")}`;
}

/**
 * Attribue le prochain numéro d'un document. DOIT être appelé dans la même
 * transaction que la création du document : si celle-ci échoue, le compteur
 * est annulé avec elle, ce qui garantit l'absence de trou. Le verrou de ligne
 * (FOR UPDATE) sérialise les émissions concurrentes : pas de doublon.
 */
export async function allocateDocumentNumber(
  tx: Prisma.TransactionClient,
  params: { companyId: string; type: DocumentType; date: Date; yearlyReset?: boolean }
): Promise<string> {
  const { companyId, type, date } = params;
  const year = date.getUTCFullYear();

  await tx.documentCounter.upsert({
    where: { companyId_documentType: { companyId, documentType: type } },
    create: {
      companyId,
      documentType: type,
      prefix: DEFAULT_PREFIXES[type],
      yearlyReset: params.yearlyReset ?? true,
      currentYear: year,
      lastNumber: 0,
    },
    update: {},
  });

  const rows = await tx.$queryRaw<
    Array<{ id: string; prefix: string; yearlyReset: boolean; currentYear: number | null; lastNumber: number }>
  >`SELECT "id", "prefix", "yearlyReset", "currentYear", "lastNumber"
      FROM "document_counters"
      WHERE "companyId" = ${companyId} AND "documentType" = ${type}::"DocumentType"
      FOR UPDATE`;
  const counter = rows[0];
  if (!counter) throw new Error("Compteur de numérotation introuvable");

  const resetNeeded = counter.yearlyReset && counter.currentYear !== year;
  const sequence = resetNeeded ? 1 : counter.lastNumber + 1;

  await tx.documentCounter.update({
    where: { id: counter.id },
    data: { lastNumber: sequence, currentYear: counter.yearlyReset ? year : null },
  });

  return formatDocumentNumber({
    prefix: counter.prefix,
    sequence,
    year: counter.yearlyReset ? year : undefined,
  });
}

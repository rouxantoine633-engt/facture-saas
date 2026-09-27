export type DeletionStrategy = "HARD_DELETE" | "ANONYMIZE";

export interface DeletionCounts {
  emittedInvoices: number;
  creditNotes: number;
}

/**
 * Une facture émise ou un avoir doivent être conservés 10 ans (Code de commerce,
 * art. L123-22) : leur existence l'emporte sur le droit à l'effacement (RGPD,
 * art. 17§3.b). Dans ce cas, la fermeture de compte anonymise plutôt que
 * supprime. Un compte n'ayant jamais rien émis peut être effacé entièrement.
 */
export function pickDeletionStrategy(counts: DeletionCounts): DeletionStrategy {
  return counts.emittedInvoices === 0 && counts.creditNotes === 0 ? "HARD_DELETE" : "ANONYMIZE";
}

const EMAIL_LIKE = /[^\s"]+@[^\s"]+\.[^\s".]+/g;

/**
 * Retire les adresses email des métadonnées du journal d'audit (ex : destinataire
 * d'un email envoyé) tout en conservant la trace de l'action elle-même.
 */
export function redactAuditMetadata(metadata: unknown): unknown {
  if (metadata === null || metadata === undefined) return metadata;
  if (typeof metadata === "string") return metadata.replace(EMAIL_LIKE, "[email retiré]");
  if (Array.isArray(metadata)) return metadata.map(redactAuditMetadata);
  if (typeof metadata === "object") {
    return Object.fromEntries(
      Object.entries(metadata as Record<string, unknown>).map(([k, v]) => [k, redactAuditMetadata(v)])
    );
  }
  return metadata;
}

export const ANONYMIZED_CLIENT_NAME = "Client (compte clos)";
export const ANONYMIZED_COMPANY_NAME = "Compte clôturé";

export function anonymizedEmailFor(userId: string): string {
  return `compte-supprime+${userId}@deleted.invalid`;
}

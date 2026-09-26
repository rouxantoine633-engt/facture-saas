import { addDays } from "./dates";

export type PlanningStatus = "SENT" | "CANCELLED" | "FAILED";

export interface ExistingReminder {
  offsetDays: number;
  status: PlanningStatus;
}

export interface ReminderPlan {
  /** Décalage (jours après échéance) du rappel à envoyer maintenant, ou null. */
  toSend: number | null;
  /** Décalages à marquer « annulés » : dépassés par un rappel plus récent. */
  toCancel: number[];
}

export function normalizeOffsets(offsets: number[]): number[] {
  return [...new Set(offsets.filter((n) => Number.isInteger(n) && n >= 1))].sort((a, b) => a - b);
}

/**
 * Décide quel rappel envoyer. Si le traitement quotidien a été interrompu et que
 * plusieurs paliers sont échus (ex. J+7 et J+15), seul le plus récent est envoyé :
 * on n'envoie jamais deux relances le même jour, ni un palier déjà dépassé par un plus grand.
 */
export function planReminders(params: {
  dueDate: Date;
  offsetsDays: number[];
  existing: ExistingReminder[];
  now: Date;
}): ReminderPlan {
  const { dueDate, existing, now } = params;
  const dueOffsets = normalizeOffsets(params.offsetsDays).filter(
    (offset) => addDays(dueDate, offset).getTime() <= now.getTime()
  );

  const settled = new Set(existing.filter((r) => r.status === "SENT" || r.status === "CANCELLED").map((r) => r.offsetDays));
  const maxSent = Math.max(0, ...existing.filter((r) => r.status === "SENT").map((r) => r.offsetDays));

  const open = dueOffsets.filter((offset) => !settled.has(offset));
  const superseded = open.filter((offset) => offset < maxSent);
  const candidates = open.filter((offset) => offset > maxSent);

  if (candidates.length === 0) return { toSend: null, toCancel: superseded };

  const toSend = Math.max(...candidates);
  return { toSend, toCancel: [...superseded, ...candidates.filter((o) => o !== toSend)] };
}

/** Un rappel ferme (2e relance ou plus) rappelle les conséquences légales du retard. */
export function isFirmReminder(offsetDays: number, allOffsets: number[]): boolean {
  const sorted = normalizeOffsets(allOffsets);
  return sorted.length > 1 && offsetDays > (sorted[0] ?? offsetDays);
}

/** Parse « 7, 15 » saisi par l'utilisateur ; ignore les valeurs invalides. */
export function parseOffsetsInput(input: string): number[] {
  return normalizeOffsets(
    input
      .split(/[,;\s]+/)
      .filter(Boolean)
      .map(Number)
  );
}

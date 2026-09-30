const DAY_MS = 24 * 60 * 60 * 1000;

/** Début de la journée UTC contenant `date`. Les échéances sont stockées à minuit UTC. */
export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Une facture est en retard à partir du lendemain de son échéance (payable « avant le » ce jour inclus). */
export function isOverdue(dueDate: Date, now: Date): boolean {
  return dueDate.getTime() < startOfUtcDay(now).getTime();
}

/** Nombre de jours de retard (0 si l'échéance n'est pas dépassée). */
export function daysOverdue(dueDate: Date, now: Date): number {
  const diff = startOfUtcDay(now).getTime() - startOfUtcDay(dueDate).getTime();
  return Math.max(0, Math.round(diff / DAY_MS));
}

/** Premier jour du mois UTC contenant `date`, à minuit. */
export function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** `date` décalée de `months` mois (calendaire, pas 30 jours) ; jour fixé au 1er pour éviter tout débordement de mois. */
export function addUtcMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

/** Clé triable "AAAA-MM" pour grouper des dates par mois. */
export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

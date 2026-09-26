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

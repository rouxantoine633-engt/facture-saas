const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366 * 5;

/** Période d'export [from, to] inclusive : `to` couvre toute la journée UTC. */
export function parseExportRange(
  fromParam: string | null,
  toParam: string | null
): { from: Date; to: Date } | { error: string } {
  if (!fromParam || !toParam || !DATE.test(fromParam) || !DATE.test(toParam)) {
    return { error: "Indiquez une période valide (dates de début et de fin)." };
  }
  const from = new Date(`${fromParam}T00:00:00.000Z`);
  const to = new Date(`${toParam}T23:59:59.999Z`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return { error: "Indiquez une période valide (dates de début et de fin)." };
  }
  if (to.getTime() < from.getTime()) return { error: "La date de fin doit être après la date de début." };
  if ((to.getTime() - from.getTime()) / 86_400_000 > MAX_RANGE_DAYS) {
    return { error: "La période d'export ne peut pas dépasser 5 ans." };
  }
  return { from, to };
}

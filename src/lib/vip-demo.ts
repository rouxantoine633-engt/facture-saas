import { timingSafeEqual } from "crypto";

/**
 * Compare au secret VIP_DEMO_CODE (démos commerciales) en temps constant,
 * même pattern que la protection CRON_SECRET. Jamais exposé ni suggéré
 * dans l'UI publique ; code vide ou absent du serveur → false partout.
 */
export function matchesVipCode(provided: string): boolean {
  const secret = process.env.VIP_DEMO_CODE;
  if (!secret || !provided) return false;
  const providedBuf = Buffer.from(provided);
  const secretBuf = Buffer.from(secret);
  return providedBuf.length === secretBuf.length && timingSafeEqual(providedBuf, secretBuf);
}

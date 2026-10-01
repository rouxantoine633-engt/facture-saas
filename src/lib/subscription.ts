import type { SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

/** Passthrough direct depuis Stripe.Subscription.status — voir le commentaire sur l'enum Prisma. */
export function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "incomplete":
      return "INCOMPLETE";
    case "incomplete_expired":
      return "INCOMPLETE_EXPIRED";
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "unpaid":
      return "UNPAID";
    case "paused":
      return "PAUSED";
    default:
      // Le type Stripe reste ouvert (compat. ascendante) : un statut futur
      // encore inconnu ne doit jamais être traité comme un accès valide.
      console.warn(`Statut d'abonnement Stripe non reconnu : ${status}`);
      return "NONE";
  }
}

/** Statuts donnant droit à l'accès au service. `PAST_DUE` reste inclus : Stripe retente le paiement avant d'annuler. */
const ACTIVE_STATUSES: ReadonlySet<SubscriptionStatus> = new Set(["ACTIVE", "TRIALING", "PAST_DUE"]);

/** `isVip` (démo commerciale) donne accès indépendamment du statut Stripe. */
export function hasActiveAccess(status: SubscriptionStatus, isVip = false): boolean {
  return isVip || ACTIVE_STATUSES.has(status);
}

/**
 * Depuis les versions récentes de l'API Stripe, `current_period_end` vit sur
 * la ligne d'abonnement (`items.data[]`), plus sur `Subscription` lui-même —
 * une souscription peut avoir plusieurs lignes avec des échéances propres.
 * On n'a qu'une seule ligne (un prix unique), donc on prend la première.
 */
export function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const item = subscription.items.data[0];
  return item ? new Date(item.current_period_end * 1000) : null;
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  NONE: "Aucun abonnement",
  INCOMPLETE: "Paiement incomplet",
  INCOMPLETE_EXPIRED: "Paiement expiré",
  TRIALING: "Période d'essai",
  ACTIVE: "Actif",
  PAST_DUE: "Paiement en retard",
  CANCELED: "Résilié",
  UNPAID: "Impayé",
  PAUSED: "En pause",
};

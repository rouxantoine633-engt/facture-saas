import Stripe from "stripe";

let cached: Stripe | null = null;

/** Montant de l'abonnement mensuel, en centimes — évite les erreurs d'arrondi flottant. */
export const SUBSCRIPTION_PRICE_CENTS = 3900;
export const SUBSCRIPTION_CURRENCY = "eur";
export const SUBSCRIPTION_PRODUCT_NAME = "Abonnement Devis & Factures";

export class StripeConfigError extends Error {}

/** Lève une erreur claire si la clé n'est pas configurée, plutôt qu'un crash Stripe SDK opaque. */
export function getStripeClient(): Stripe {
  if (!cached) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new StripeConfigError("Le paiement n'est pas encore configuré sur ce service.");
    }
    cached = new Stripe(secretKey);
  }
  return cached;
}

import type Stripe from "stripe";

export type CancelOutcome = "NO_SUBSCRIPTION" | "CANCELED" | "ALREADY_CANCELED";

/**
 * Met fin immédiatement à l'abonnement Stripe d'un compte qu'on ferme, pour qu'aucun prélèvement
 * ne continue après la suppression. Idempotent : un abonnement déjà résilié ou introuvable n'est pas une erreur.
 * Toute autre erreur est propagée : l'appelant doit alors renoncer à fermer le compte.
 */
export async function cancelSubscriptionForClosure(
  stripe: Pick<Stripe, "subscriptions">,
  subscriptionId: string | null | undefined
): Promise<CancelOutcome> {
  if (!subscriptionId) return "NO_SUBSCRIPTION";

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.status === "canceled") return "ALREADY_CANCELED";
    await stripe.subscriptions.cancel(subscriptionId);
    return "CANCELED";
  } catch (e) {
    if ((e as { code?: string }).code === "resource_missing") return "ALREADY_CANCELED";
    throw e;
  }
}

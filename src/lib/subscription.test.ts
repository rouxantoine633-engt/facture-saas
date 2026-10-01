import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { getSubscriptionPeriodEnd, hasActiveAccess, mapStripeSubscriptionStatus } from "./subscription";

describe("mapStripeSubscriptionStatus", () => {
  it("reprend chaque statut Stripe sans perte d'information", () => {
    expect(mapStripeSubscriptionStatus("active")).toBe("ACTIVE");
    expect(mapStripeSubscriptionStatus("trialing")).toBe("TRIALING");
    expect(mapStripeSubscriptionStatus("past_due")).toBe("PAST_DUE");
    expect(mapStripeSubscriptionStatus("canceled")).toBe("CANCELED");
    expect(mapStripeSubscriptionStatus("unpaid")).toBe("UNPAID");
    expect(mapStripeSubscriptionStatus("incomplete")).toBe("INCOMPLETE");
    expect(mapStripeSubscriptionStatus("incomplete_expired")).toBe("INCOMPLETE_EXPIRED");
    expect(mapStripeSubscriptionStatus("paused")).toBe("PAUSED");
  });

  it("retombe sur NONE (pas d'accès) pour un statut futur inconnu de Stripe", () => {
    expect(mapStripeSubscriptionStatus("un_statut_futur" as Stripe.Subscription.Status)).toBe("NONE");
  });
});

describe("hasActiveAccess", () => {
  it("autorise l'accès pendant l'essai, actif, ou en retard de paiement (Stripe retente avant d'annuler)", () => {
    expect(hasActiveAccess("ACTIVE")).toBe(true);
    expect(hasActiveAccess("TRIALING")).toBe(true);
    expect(hasActiveAccess("PAST_DUE")).toBe(true);
  });

  it("refuse l'accès dans tous les autres cas", () => {
    expect(hasActiveAccess("NONE")).toBe(false);
    expect(hasActiveAccess("CANCELED")).toBe(false);
    expect(hasActiveAccess("UNPAID")).toBe(false);
    expect(hasActiveAccess("INCOMPLETE")).toBe(false);
    expect(hasActiveAccess("INCOMPLETE_EXPIRED")).toBe(false);
    expect(hasActiveAccess("PAUSED")).toBe(false);
  });

  it("autorise l'accès VIP (démo) même sans abonnement Stripe", () => {
    expect(hasActiveAccess("NONE", true)).toBe(true);
    expect(hasActiveAccess("CANCELED", true)).toBe(true);
  });

  it("isVip à false ne change rien au comportement par défaut", () => {
    expect(hasActiveAccess("NONE", false)).toBe(false);
    expect(hasActiveAccess("ACTIVE", false)).toBe(true);
  });
});

describe("getSubscriptionPeriodEnd", () => {
  it("lit l'échéance sur la première ligne d'abonnement", () => {
    const subscription = {
      items: { data: [{ current_period_end: 1_800_000_000 }] },
    } as unknown as Stripe.Subscription;
    expect(getSubscriptionPeriodEnd(subscription)).toEqual(new Date(1_800_000_000 * 1000));
  });

  it("renvoie null si l'abonnement n'a aucune ligne", () => {
    const subscription = { items: { data: [] } } as unknown as Stripe.Subscription;
    expect(getSubscriptionPeriodEnd(subscription)).toBeNull();
  });
});

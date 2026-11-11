import { describe, expect, it, vi } from "vitest";
import { cancelSubscriptionForClosure } from "./stripe-subscription";

function fakeStripe(retrieve: () => Promise<unknown>, cancel = vi.fn(async () => ({}))) {
  return { client: { subscriptions: { retrieve: vi.fn(retrieve), cancel } } as never, cancel };
}

describe("cancelSubscriptionForClosure", () => {
  it("ne fait rien sans abonnement", async () => {
    const { client, cancel } = fakeStripe(async () => ({}));
    expect(await cancelSubscriptionForClosure(client, null)).toBe("NO_SUBSCRIPTION");
    expect(await cancelSubscriptionForClosure(client, undefined)).toBe("NO_SUBSCRIPTION");
    expect(cancel).not.toHaveBeenCalled();
  });

  it("résilie immédiatement un abonnement actif", async () => {
    const { client, cancel } = fakeStripe(async () => ({ status: "active" }));
    expect(await cancelSubscriptionForClosure(client, "sub_1")).toBe("CANCELED");
    expect(cancel).toHaveBeenCalledWith("sub_1");
  });

  it("ne résilie pas deux fois un abonnement déjà résilié", async () => {
    const { client, cancel } = fakeStripe(async () => ({ status: "canceled" }));
    expect(await cancelSubscriptionForClosure(client, "sub_1")).toBe("ALREADY_CANCELED");
    expect(cancel).not.toHaveBeenCalled();
  });

  it("considère un abonnement introuvable comme déjà résilié", async () => {
    const { client } = fakeStripe(async () => Promise.reject(Object.assign(new Error("No such subscription"), { code: "resource_missing" })));
    expect(await cancelSubscriptionForClosure(client, "sub_gone")).toBe("ALREADY_CANCELED");
  });

  it("propage toute autre erreur, pour ne pas fermer un compte encore facturé", async () => {
    const { client } = fakeStripe(async () => Promise.reject(new Error("réseau")));
    await expect(cancelSubscriptionForClosure(client, "sub_1")).rejects.toThrow("réseau");
    const failingCancel = vi.fn(async () => Promise.reject(new Error("Stripe indisponible")));
    const { client: client2 } = fakeStripe(async () => ({ status: "active" }), failingCancel);
    await expect(cancelSubscriptionForClosure(client2, "sub_1")).rejects.toThrow("Stripe indisponible");
  });
});

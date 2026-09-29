import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET manquant dans l'environnement");

// N'effectue jamais d'appel réseau ici : sert uniquement à fabriquer une
// signature de test locale (stripe.webhooks.generateTestHeaderString).
const stripe = new Stripe("sk_test_dummy_not_real");

function assert(cond, msg) {
  if (!cond) throw new Error(`ÉCHEC : ${msg}`);
  console.log(`OK: ${msg}`);
}

async function post(event) {
  const payloadString = JSON.stringify(event);
  const header = stripe.webhooks.generateTestHeaderString({ payload: payloadString, secret: webhookSecret });
  const res = await fetch("http://localhost:3000/api/stripe/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Stripe-Signature": header },
    body: payloadString,
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  const company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
  if (!company) throw new Error("Aucune entreprise en base — lancez d'abord npm run smoke.");

  const originalState = {
    stripeCustomerId: company.stripeCustomerId,
    stripeSubscriptionId: company.stripeSubscriptionId,
    subscriptionStatus: company.subscriptionStatus,
    subscriptionCurrentPeriodEnd: company.subscriptionCurrentPeriodEnd,
  };

  const customerId = `cus_test_local_${Date.now()}`;
  const subscriptionId = `sub_test_local_${Date.now()}`;
  await prisma.company.update({ where: { id: company.id }, data: { stripeCustomerId: customerId } });

  try {
    // --- Rejette une signature invalide ---
    const badRes = await fetch("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Stripe-Signature": "t=1,v1=invalide" },
      body: JSON.stringify({ type: "customer.subscription.updated" }),
    });
    assert(badRes.status === 400, "rejette une signature invalide (400)");

    // --- customer.subscription.updated -> ACTIVE ---
    const periodEnd = Math.floor(Date.now() / 1000) + 30 * 86400;
    const activeRes = await post({
      id: "evt_test_active",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: subscriptionId,
          status: "active",
          customer: customerId,
          items: { data: [{ current_period_end: periodEnd }] },
        },
      },
    });
    assert(activeRes.status === 200, `customer.subscription.updated (active) accepté (${activeRes.status})`);

    let updated = await prisma.company.findUnique({ where: { id: company.id } });
    assert(updated.subscriptionStatus === "ACTIVE", `statut mis à ACTIVE (obtenu: ${updated.subscriptionStatus})`);
    assert(updated.stripeSubscriptionId === subscriptionId, "stripeSubscriptionId enregistré");
    assert(
      Math.abs(updated.subscriptionCurrentPeriodEnd.getTime() - periodEnd * 1000) < 1000,
      "subscriptionCurrentPeriodEnd correctement converti depuis le timestamp Unix"
    );

    // --- customer.subscription.deleted -> CANCELED ---
    const canceledRes = await post({
      id: "evt_test_canceled",
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: subscriptionId,
          status: "canceled",
          customer: customerId,
          items: { data: [{ current_period_end: periodEnd }] },
        },
      },
    });
    assert(canceledRes.status === 200, `customer.subscription.deleted accepté (${canceledRes.status})`);

    updated = await prisma.company.findUnique({ where: { id: company.id } });
    assert(updated.subscriptionStatus === "CANCELED", `statut mis à CANCELED (obtenu: ${updated.subscriptionStatus})`);

    // --- Événement pour un client Stripe inconnu : ignoré sans erreur ---
    const unknownRes = await post({
      id: "evt_test_unknown",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_inconnu",
          status: "active",
          customer: "cus_qui_nexiste_pas",
          items: { data: [{ current_period_end: periodEnd }] },
        },
      },
    });
    assert(unknownRes.status === 200, `client Stripe inconnu : ignoré proprement (${unknownRes.status})`);

    console.log("\nTous les contrôles du webhook Stripe sont passés.");
  } finally {
    // Toujours restaurer l'état d'origine de l'entreprise de test, même en cas d'échec.
    await prisma.company.update({ where: { id: company.id }, data: originalState });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

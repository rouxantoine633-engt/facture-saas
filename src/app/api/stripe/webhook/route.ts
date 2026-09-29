import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient, StripeConfigError } from "@/lib/stripe";
import { getSubscriptionPeriodEnd, mapStripeSubscriptionStatus } from "@/lib/subscription";

export const runtime = "nodejs";

/**
 * Webhook Stripe : seule source de vérité pour le statut d'abonnement.
 * Ne jamais faire confiance à autre chose (paramètre d'URL, session
 * navigateur) pour savoir si un client est abonné.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET non configuré");
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  let stripe: Stripe;
  try {
    stripe = getStripeClient();
  } catch (e) {
    if (e instanceof StripeConfigError) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    throw e;
  }

  // La signature porte sur le corps BRUT : ne jamais passer par request.json() ici.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e) {
    console.error("Signature Stripe invalide", e);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, stripe);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscriptionStatus(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (e) {
    console.error(`Erreur de traitement du webhook Stripe (${event.type})`, e);
    // 500 : Stripe retentera automatiquement l'envoi de cet événement.
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, stripe: Stripe) {
  const companyId = session.client_reference_id;
  if (!companyId || typeof session.customer !== "string") return;

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return;

  const data: {
    stripeCustomerId: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: ReturnType<typeof mapStripeSubscriptionStatus>;
    subscriptionCurrentPeriodEnd?: Date;
  } = { stripeCustomerId: session.customer };

  if (typeof session.subscription === "string") {
    // Récupéré directement plutôt que d'attendre customer.subscription.created,
    // dont l'ordre d'arrivée par rapport à cet événement n'est pas garanti.
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    data.stripeSubscriptionId = subscription.id;
    data.subscriptionStatus = mapStripeSubscriptionStatus(subscription.status);
    data.subscriptionCurrentPeriodEnd = getSubscriptionPeriodEnd(subscription) ?? undefined;
  }

  await prisma.company.update({ where: { id: company.id }, data });
}

async function syncSubscriptionStatus(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const company = await prisma.company.findUnique({ where: { stripeCustomerId: customerId } });
  if (!company) return; // Pas encore lié (course avec checkout.session.completed) : rien à faire ici.

  await prisma.company.update({
    where: { id: company.id },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: mapStripeSubscriptionStatus(subscription.status),
      subscriptionCurrentPeriodEnd: getSubscriptionPeriodEnd(subscription),
    },
  });
}

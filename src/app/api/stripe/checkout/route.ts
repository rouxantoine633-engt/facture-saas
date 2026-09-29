import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getStripeClient,
  StripeConfigError,
  SUBSCRIPTION_CURRENCY,
  SUBSCRIPTION_PRICE_CENTS,
  SUBSCRIPTION_PRODUCT_NAME,
} from "@/lib/stripe";

export const runtime = "nodejs";

/** Crée une session Stripe Checkout pour l'abonnement mensuel et renvoie son URL de redirection. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  const company = await prisma.company.findUnique({ where: { ownerId: session.user.id } });
  if (!company) {
    return NextResponse.json({ error: "Configurez d'abord le profil de votre entreprise." }, { status: 400 });
  }

  const origin = process.env.AUTH_URL ?? new URL(request.url).origin;

  try {
    const stripe = getStripeClient();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      // Managed Payments (calcul de taxe automatique par Stripe) exige un
      // tax_code produit ; la question de la TVA sur les frais d'abonnement
      // n'est pas encore tranchée (voir README, point de conformité 16) —
      // désactivé explicitement plutôt que de deviner un code de taxe.
      managed_payments: { enabled: false },
      line_items: [
        {
          price_data: {
            currency: SUBSCRIPTION_CURRENCY,
            product_data: { name: SUBSCRIPTION_PRODUCT_NAME },
            unit_amount: SUBSCRIPTION_PRICE_CENTS,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      client_reference_id: company.id,
      customer_email: session.user.email ?? undefined,
      success_url: `${origin}/app/compte?abonnement=succes`,
      cancel_url: `${origin}/app/compte?abonnement=annule`,
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Impossible de démarrer le paiement. Réessayez." }, { status: 502 });
    }
    return NextResponse.json({ url: checkoutSession.url });
  } catch (e) {
    if (e instanceof StripeConfigError) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    console.error("Erreur Stripe Checkout", e);
    return NextResponse.json({ error: "Impossible de démarrer le paiement. Réessayez." }, { status: 502 });
  }
}

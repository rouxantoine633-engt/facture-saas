"use server";

import { auth, signOut } from "@/lib/auth";
import { closeAccount } from "@/lib/gdpr/account";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { cancelSubscriptionForClosure } from "@/lib/stripe-subscription";

export interface DeleteAccountResult {
  error?: string;
}

export async function deleteAccountAction(confirmationEmail: string): Promise<DeleteAccountResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return { error: "Vous devez être connecté." };

  if (confirmationEmail.trim().toLowerCase() !== session.user.email.toLowerCase()) {
    return { error: "L'adresse saisie ne correspond pas à celle de votre compte." };
  }

  const company = await prisma.company.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true, stripeSubscriptionId: true },
  });

  // L'abonnement doit cesser avant la fermeture : sinon le client serait encore prélevé sans plus pouvoir se
  // connecter. En cas d'échec (Stripe injoignable ou non configuré), on renonce à fermer le compte.
  if (company?.stripeSubscriptionId) {
    try {
      await cancelSubscriptionForClosure(getStripeClient(), company.stripeSubscriptionId);
    } catch (e) {
      console.error("Résiliation Stripe impossible lors de la suppression du compte", e);
      return {
        error:
          "Nous n'avons pas pu résilier votre abonnement : votre compte n'a donc pas été supprimé. Réessayez dans quelques instants ou contactez-nous.",
      };
    }
  }

  await closeAccount({ userId: session.user.id, companyId: company?.id ?? null });

  await signOut({ redirectTo: "/app/compte/supprime" });
  return {};
}

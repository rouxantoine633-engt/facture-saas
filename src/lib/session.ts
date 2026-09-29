import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/lib/subscription";

/** Renvoie l'utilisateur connecté et son entreprise, ou redirige vers l'étape manquante. */
export async function requireCompany() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  const company = await prisma.company.findUnique({
    where: { ownerId: session.user.id },
  });
  if (!company) redirect("/app/entreprise/configuration");
  return { userId: session.user.id, company };
}

/**
 * Comme `requireCompany`, mais verrouille en plus les fonctionnalités
 * payantes derrière un abonnement actif. Ne jamais utiliser sur le profil
 * entreprise (qu'il faut pouvoir configurer avant de payer), ni sur `/app/compte`
 * ou la route de facturation Stripe (sinon un utilisateur non abonné ne
 * pourrait jamais atteindre le bouton pour s'abonner, ni ses droits RGPD).
 */
export async function requireActiveCompany() {
  const { userId, company } = await requireCompany();
  if (!hasActiveAccess(company.subscriptionStatus)) {
    redirect("/app/compte?abonnement=requis");
  }
  return { userId, company };
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { previewAccountDeletion } from "@/lib/gdpr/account";
import { DeleteAccountForm } from "./DeleteAccountForm";
import { SubscribeButton } from "@/components/SubscribeButton";
import { VipAccessForm } from "@/components/VipAccessForm";
import { hasActiveAccess, SUBSCRIPTION_STATUS_LABELS } from "@/lib/subscription";
import { formatDate } from "@/lib/labels";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ abonnement?: string; demo?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) redirect("/connexion");
  const { abonnement, demo } = await searchParams;
  const isDemo = demo === "true";

  const company = await prisma.company.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true, subscriptionStatus: true, subscriptionCurrentPeriodEnd: true, isVipAccess: true },
  });
  const preview = company ? await previewAccountDeletion(company.id) : { strategy: "HARD_DELETE" as const };
  const isActive = company ? hasActiveAccess(company.subscriptionStatus, company.isVipAccess) : false;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Mes données</h1>
      <p className="mb-6 text-gray-600">
        Conformément au RGPD, vous pouvez récupérer une copie de toutes vos données ou supprimer votre compte.
      </p>

      {abonnement === "requis" && !isActive && (
        <p role="alert" className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Un abonnement actif est nécessaire pour accéder à cette fonctionnalité.
        </p>
      )}
      {abonnement === "succes" && (
        <p role="status" className="mb-6 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-900">
          Merci ! Votre abonnement est en cours d'activation — le statut ci-dessous se met à jour automatiquement
          dans les prochaines secondes.
        </p>
      )}

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold">Abonnement</h2>
        <p className="mt-1 text-sm">
          Statut :{" "}
          <span className={isActive ? "font-medium text-green-700" : "font-medium text-gray-700"}>
            {company?.isVipAccess
              ? "Accès VIP (démonstration)"
              : SUBSCRIPTION_STATUS_LABELS[company?.subscriptionStatus ?? "NONE"]}
          </span>
          {isActive && !company?.isVipAccess && company?.subscriptionCurrentPeriodEnd && (
            <> · prochain renouvellement le {formatDate(company.subscriptionCurrentPeriodEnd)}</>
          )}
        </p>
        {!isActive && (
          <>
            <p className="mt-1 text-sm text-gray-600">
              Accès complet au service pour 39 € par mois, sans engagement. Paiement sécurisé par Stripe.
            </p>
            <div className="mt-3">
              <SubscribeButton />
            </div>
            {isDemo && <VipAccessForm />}
          </>
        )}
      </section>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold">Télécharger mes données</h2>
        <p className="mt-1 text-sm text-gray-600">
          Un fichier JSON contenant votre profil, votre entreprise, vos clients, devis, factures et avoirs.
        </p>
        <a href="/app/compte/export" className="mt-3 inline-block text-brand-700 underline">
          Télécharger (JSON)
        </a>
      </section>

      <DeleteAccountForm email={session.user.email} strategy={preview.strategy} />
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { previewAccountDeletion } from "@/lib/gdpr/account";
import { DeleteAccountForm } from "./DeleteAccountForm";
import { SubscribeButton } from "@/components/SubscribeButton";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) redirect("/connexion");

  const company = await prisma.company.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
  const preview = company ? await previewAccountDeletion(company.id) : { strategy: "HARD_DELETE" as const };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Mes données</h1>
      <p className="mb-6 text-gray-600">
        Conformément au RGPD, vous pouvez récupérer une copie de toutes vos données ou supprimer votre compte.
      </p>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold">Abonnement</h2>
        <p className="mt-1 text-sm text-gray-600">
          Accès complet au service pour 39 € par mois, sans engagement. Paiement sécurisé par Stripe.
        </p>
        <div className="mt-3">
          <SubscribeButton />
        </div>
      </section>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold">Télécharger mes données</h2>
        <p className="mt-1 text-sm text-gray-600">
          Un fichier JSON contenant votre profil, votre entreprise, vos clients, devis, factures et avoirs.
        </p>
        <a href="/compte/export" className="mt-3 inline-block text-brand-700 underline">
          Télécharger (JSON)
        </a>
      </section>

      <DeleteAccountForm email={session.user.email} strategy={preview.strategy} />
    </div>
  );
}

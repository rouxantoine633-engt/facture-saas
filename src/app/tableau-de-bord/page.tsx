import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/connexion");
  }

  const company = await prisma.company.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!company) {
    redirect("/entreprise/configuration");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <p className="mt-2 text-gray-600">
        Bienvenue, {company.legalName}.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard title="Brouillons" value="—" />
        <DashboardCard title="En attente de paiement" value="—" />
        <DashboardCard title="En retard" value="—" />
      </div>

      <p className="mt-8 text-sm text-gray-500">
        Prochaine étape : création de devis (à venir).
      </p>
      <Link
        href="/entreprise/configuration"
        className="mt-4 inline-block text-brand-600 underline"
      >
        Modifier le profil de l'entreprise
      </Link>
    </div>
  );
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

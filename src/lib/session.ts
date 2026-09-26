import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Renvoie l'utilisateur connecté et son entreprise, ou redirige vers l'étape manquante. */
export async function requireCompany() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  const company = await prisma.company.findUnique({
    where: { ownerId: session.user.id },
  });
  if (!company) redirect("/entreprise/configuration");
  return { userId: session.user.id, company };
}

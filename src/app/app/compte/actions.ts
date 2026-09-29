"use server";

import { auth, signOut } from "@/lib/auth";
import { closeAccount } from "@/lib/gdpr/account";
import { prisma } from "@/lib/prisma";

export interface DeleteAccountResult {
  error?: string;
}

export async function deleteAccountAction(confirmationEmail: string): Promise<DeleteAccountResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return { error: "Vous devez être connecté." };

  if (confirmationEmail.trim().toLowerCase() !== session.user.email.toLowerCase()) {
    return { error: "L'adresse saisie ne correspond pas à celle de votre compte." };
  }

  const company = await prisma.company.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
  await closeAccount({ userId: session.user.id, companyId: company?.id ?? null });

  await signOut({ redirectTo: "/app/compte/supprime" });
  return {};
}

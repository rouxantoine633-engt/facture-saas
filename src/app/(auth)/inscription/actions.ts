"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation/auth";
import { matchesVipCode } from "@/lib/vip-demo";

export interface RegisterFormState {
  error?: string;
  success?: boolean;
}

export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData
): Promise<RegisterFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Un compte existe déjà avec cette adresse email." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, passwordHash },
  });

  return { success: true };
}

export interface DemoProvisionResult {
  success: boolean;
}

/**
 * Provisionnement instantané pour une démo commerciale : crée une
 * entreprise fictive minimale et accorde l'accès VIP, en un seul appel,
 * pour sauter entièrement l'écran de configuration et Stripe.
 *
 * Réservé en interne : n'a aucun effet (success:false) si `code` ne
 * correspond pas au secret VIP_DEMO_CODE — le parcours normal reprend
 * alors sans aucune différence visible. Ne touche jamais
 * subscriptionStatus (réservé au webhook Stripe) ni une entreprise déjà
 * configurée par l'utilisateur.
 */
export async function provisionDemoAccountAction(code: string): Promise<DemoProvisionResult> {
  if (!matchesVipCode(code)) return { success: false };

  const session = await auth();
  if (!session?.user?.id || !session.user.email) return { success: false };

  const existing = await prisma.company.findUnique({ where: { ownerId: session.user.id } });
  if (existing) return { success: false };

  const company = await prisma.company.create({
    data: {
      ownerId: session.user.id,
      legalName: "Entreprise Démo Onyx",
      legalForm: "AUTO_ENTREPRENEUR",
      siren: "000000001",
      siret: "00000000100017",
      vatRegime: "FRANCHISE_EN_BASE",
      addressLine1: "12 rue de la Démo",
      postalCode: "75001",
      city: "Paris",
      country: "France",
      email: session.user.email,
      isVipAccess: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      userId: session.user.id,
      action: "subscription.vip_auto_provisioned",
      entityType: "Company",
      entityId: company.id,
    },
  });

  return { success: true };
}

"use server";

import { timingSafeEqual } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { companySchema, type CompanyInput } from "@/lib/validation/company";

export interface SaveCompanyResult {
  error?: string;
  success?: boolean;
}

export async function saveCompanyAction(
  input: CompanyInput
): Promise<SaveCompanyResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Vous devez être connecté." };
  }

  const parsed = companySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  const shareCapitalCents =
    data.shareCapitalEuros !== undefined
      ? Math.round(data.shareCapitalEuros * 100)
      : null;

  const payload = {
    legalName: data.legalName,
    commercialName: data.commercialName || null,
    legalForm: data.legalForm,
    siren: data.siren,
    siret: data.siret,
    vatRegime: data.vatRegime,
    vatNumber: data.vatNumber || null,
    rcsCity: data.rcsCity || null,
    rcsNumber: data.rcsNumber || null,
    shareCapitalCents,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2 || null,
    postalCode: data.postalCode,
    city: data.city,
    country: data.country,
    email: data.email,
    phone: data.phone || null,
    iban: data.iban || null,
    bic: data.bic || null,
    defaultPaymentTermsDays: data.defaultPaymentTermsDays,
    reminderOffsetsDays: data.reminderOffsetsDays,
  };

  await prisma.company.upsert({
    where: { ownerId: session.user.id },
    create: { ownerId: session.user.id, ...payload },
    update: payload,
  });

  return { success: true };
}

export async function getCompanyAction() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.company.findUnique({ where: { ownerId: session.user.id } });
}

export interface VipAccessResult {
  error?: string;
  success?: boolean;
}

function matchesVipCode(provided: string): boolean {
  const secret = process.env.VIP_DEMO_CODE;
  if (!secret || !provided) return false;
  const providedBuf = Buffer.from(provided);
  const secretBuf = Buffer.from(secret);
  return providedBuf.length === secretBuf.length && timingSafeEqual(providedBuf, secretBuf);
}

/**
 * Active l'accès VIP (démos commerciales) sans passer par Stripe. Réservé à
 * un usage interne : le code n'est jamais affiché ni suggéré dans l'UI
 * publique, seulement communiqué en direct aux personnes qui font des démos.
 * Ne touche jamais subscriptionStatus, qui reste réservé au webhook Stripe.
 */
export async function activateVipAccessAction(code: string): Promise<VipAccessResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Vous devez être connecté." };
  }
  if (!process.env.VIP_DEMO_CODE) {
    return { error: "L'accès VIP n'est pas configuré sur ce service." };
  }
  if (!matchesVipCode(code)) {
    return { error: "Code VIP invalide." };
  }

  const company = await prisma.company.findUnique({ where: { ownerId: session.user.id } });
  if (!company) {
    return { error: "Configurez d'abord le profil de votre entreprise." };
  }

  await prisma.$transaction([
    prisma.company.update({
      where: { id: company.id },
      data: { isVipAccess: true },
    }),
    prisma.auditLog.create({
      data: {
        companyId: company.id,
        userId: session.user.id,
        action: "subscription.vip_activated",
        entityType: "Company",
        entityId: company.id,
      },
    }),
  ]);

  return { success: true };
}

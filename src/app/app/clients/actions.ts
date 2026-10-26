"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveCompany } from "@/lib/session";
import { clientSchema, type ClientInput } from "@/lib/validation/client";

export interface ClientFormState {
  error?: string;
  success?: boolean;
}

function toClientData(d: ClientInput) {
  return {
    type: d.type,
    name: d.name,
    siret: d.siret || null,
    vatNumber: d.vatNumber || null,
    addressLine1: d.addressLine1,
    postalCode: d.postalCode,
    city: d.city,
    country: d.country,
    email: d.email || null,
    phone: d.phone || null,
  };
}

export async function createClientAction(
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const { company } = await requireActiveCompany();

  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  await prisma.client.create({ data: { companyId: company.id, ...toClientData(parsed.data) } });
  revalidatePath("/app/clients");
  return { success: true };
}

/**
 * Les factures et avoirs déjà émis lisent leurs mentions figées
 * (buyerLegalSnapshot) : cette modification n'y change rien. Seuls les
 * brouillons et les devis reflètent la fiche à jour.
 */
export async function updateClientAction(
  clientId: string,
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const { company } = await requireActiveCompany();

  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  // companyId dans le filtre : un client d'une autre entreprise reste introuvable.
  const result = await prisma.client.updateMany({
    where: { id: clientId, companyId: company.id },
    data: toClientData(parsed.data),
  });
  if (result.count === 0) return { error: "Client introuvable." };

  revalidatePath("/app/clients");
  revalidatePath(`/app/clients/${clientId}`);
  return { success: true };
}

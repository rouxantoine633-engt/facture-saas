"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveCompany } from "@/lib/session";
import { clientSchema } from "@/lib/validation/client";

export interface ClientFormState {
  error?: string;
  success?: boolean;
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
  const d = parsed.data;

  await prisma.client.create({
    data: {
      companyId: company.id,
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
    },
  });
  revalidatePath("/app/clients");
  return { success: true };
}

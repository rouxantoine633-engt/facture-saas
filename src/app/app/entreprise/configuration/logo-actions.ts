"use server";

import { auth } from "@/lib/auth";
import { inspectLogo, MAX_LOGO_BYTES } from "@/lib/logo";
import { prisma } from "@/lib/prisma";

export interface LogoResult {
  error?: string;
  success?: boolean;
}

async function currentCompanyId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const company = await prisma.company.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
  return company?.id ?? null;
}

export async function uploadLogoAction(formData: FormData): Promise<LogoResult> {
  const companyId = await currentCompanyId();
  if (!companyId) return { error: "Enregistrez d'abord votre entreprise." };

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choisissez un fichier PNG ou JPEG." };
  // Refus avant lecture : on ne charge pas en mémoire un fichier manifestement trop gros.
  if (file.size > MAX_LOGO_BYTES) return { error: `Le logo est trop lourd (${Math.round(MAX_LOGO_BYTES / 1024)} Ko maximum).` };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const checked = inspectLogo(bytes);
  if (!checked.ok) return { error: checked.error };

  const data = Buffer.from(bytes);
  await prisma.companyLogo.upsert({
    where: { companyId },
    create: { companyId, data, mimeType: checked.mimeType },
    update: { data, mimeType: checked.mimeType },
  });
  return { success: true };
}

export async function removeLogoAction(): Promise<LogoResult> {
  const companyId = await currentCompanyId();
  if (!companyId) return { error: "Vous devez être connecté." };
  await prisma.companyLogo.deleteMany({ where: { companyId } });
  return { success: true };
}

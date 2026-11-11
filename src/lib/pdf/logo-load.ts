import { inspectLogo } from "@/lib/logo";
import { prisma } from "@/lib/prisma";
import type { PdfLogo } from "./logo";

/** Logo de l'entreprise, ou `undefined` s'il n'y en a pas ou s'il est illisible (le document sort alors sans logo). */
export async function loadCompanyLogo(companyId: string): Promise<PdfLogo | undefined> {
  const stored = await prisma.companyLogo.findUnique({ where: { companyId } });
  if (!stored) return undefined;
  const data = Buffer.from(stored.data);
  const checked = inspectLogo(data);
  return checked.ok ? { data, format: checked.format, width: checked.width, height: checked.height } : undefined;
}

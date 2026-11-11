import { requireCompany } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** Logo de l'entreprise de l'utilisateur connecté (aperçu dans la fiche entreprise). */
export async function GET() {
  const { company } = await requireCompany();
  const logo = await prisma.companyLogo.findUnique({ where: { companyId: company.id } });
  if (!logo) return new Response("Aucun logo", { status: 404 });
  return new Response(new Uint8Array(logo.data), {
    headers: {
      "Content-Type": logo.mimeType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-cache",
    },
  });
}

import { auth } from "@/lib/auth";
import { buildPersonalDataExport } from "@/lib/gdpr/export";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Non authentifié", { status: 401 });

  const data = await buildPersonalDataExport(session.user.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mes-donnees_${session.user.id}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}

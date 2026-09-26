import { timingSafeEqual } from "crypto";
import { runReminderJob } from "@/lib/reminder-job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const provided = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

// Vercel Cron envoie automatiquement « Authorization: Bearer $CRON_SECRET ».
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return Response.json({ error: "CRON_SECRET non configuré" }, { status: 500 });
  }
  if (!authorized(request)) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }
  const summary = await runReminderJob();
  return Response.json(summary);
}

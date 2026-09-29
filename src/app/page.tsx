import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Onyx — Devis et factures, sans friction",
  description:
    "Onyx est le SaaS de facturation et de devis pensé pour les auto-entrepreneurs et TPE françaises. Devis en un clic, factures conformes, suivi des paiements automatique. 39€/mois, sans engagement.",
};

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/tableau-de-bord");
  return <LandingPage />;
}

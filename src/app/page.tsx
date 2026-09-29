import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Onyx — Devis et factures, sans friction",
  description:
    "Onyx est le SaaS de facturation et de devis pensé pour les auto-entrepreneurs et TPE françaises. Devis en un clic, factures conformes, suivi des paiements automatique. 39€/mois, sans engagement.",
};

export default function HomePage() {
  return <LandingPage />;
}

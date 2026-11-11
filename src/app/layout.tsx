import type { Metadata } from "next";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";

export const metadata: Metadata = {
  title: {
    default: "Onyx — Devis et factures pour auto-entrepreneurs et TPE",
    template: "%s — Onyx",
  },
  description:
    "Génération de devis et factures conformes pour auto-entrepreneurs et TPE françaises.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        {/* Lien d'évitement (RGAA 12.7) : visible uniquement au focus clavier. Chaque page expose un <main id="contenu">. */}
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:font-medium focus:text-gray-900 focus:shadow-lg"
        >
          Aller au contenu principal
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Devis & Factures — SaaS auto-entrepreneurs",
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
      <body>{children}</body>
    </html>
  );
}

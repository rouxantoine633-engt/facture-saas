import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Mentions légales — Onyx",
  description: "Mentions légales du site et du service Onyx.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales" updatedAt="30 septembre 2026">
      <LegalSection title="1. Éditeur du site">
        <p>
          Le présent site et le service Onyx (ci-après « le Service ») sont édités par :{" "}
          <strong className="text-white">Antoine ROUX</strong>, entrepreneur individuel, immatriculé sous le numéro
          SIREN <strong className="text-white">105 801 179</strong>, dont le siège est situé{" "}
          <strong className="text-white">4 impasse du Pariou, 63720 Ennezat</strong>.
        </p>
        <p>
          Le Service est proposé sous le régime de la franchise en base de TVA prévue à l&apos;article 293 B du Code
          général des impôts : la TVA n&apos;est pas applicable aux sommes facturées par l&apos;éditeur au titre de
          l&apos;abonnement Onyx.
        </p>
        <p>
          Contact :{" "}
          <a
            href="mailto:roux.antoine633@gmail.com"
            className="text-indigo-300 underline underline-offset-2 hover:text-indigo-200"
          >
            roux.antoine633@gmail.com
          </a>
        </p>
        <p>Directeur de la publication : ROUX Antoine</p>
      </LegalSection>

      <LegalSection title="2. Hébergement">
        <p>
          Le site et le Service sont hébergés par :{" "}
          <strong className="text-white">[Nom de l&apos;hébergeur à compléter, ex. Vercel Inc.]</strong>,{" "}
          <span className="text-white">[adresse de l&apos;hébergeur à compléter]</span>. La base de données est
          hébergée par <strong className="text-white">[nom du fournisseur de base de données à compléter]</strong>.
        </p>
      </LegalSection>

      <LegalSection title="3. Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments composant le site Onyx (textes, graphismes, logo, code source, interface)
          est protégé par le droit de la propriété intellectuelle et demeure la propriété exclusive de
          l&apos;éditeur, sauf mention contraire. Toute reproduction, représentation, modification ou exploitation,
          totale ou partielle, sans autorisation écrite préalable est interdite.
        </p>
        <p>
          Les données et documents (devis, factures, avoirs) créés par un utilisateur au moyen du Service restent
          sa propriété exclusive.
        </p>
      </LegalSection>

      <LegalSection title="4. Responsabilité">
        <p>
          L&apos;éditeur s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées sur le site,
          mais ne saurait être tenu responsable des erreurs, omissions ou indisponibilités temporaires. L&apos;usage
          du Service est régi par les{" "}
          <a href="/cgu" className="text-indigo-300 underline underline-offset-2 hover:text-indigo-200">
            Conditions Générales d&apos;Utilisation et de Vente
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="5. Données personnelles">
        <p>
          Le traitement des données à caractère personnel est décrit dans la{" "}
          <a href="/confidentialite" className="text-indigo-300 underline underline-offset-2 hover:text-indigo-200">
            Politique de confidentialité
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Contact">
        <p>
          Pour toute question relative aux présentes mentions légales, vous pouvez écrire à{" "}
          <a
            href="mailto:roux.antoine633@gmail.com"
            className="text-indigo-300 underline underline-offset-2 hover:text-indigo-200"
          >
            roux.antoine633@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

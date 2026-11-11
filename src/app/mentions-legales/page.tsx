import type { Metadata } from "next";
import { LegalLayout, LegalSection, LegalLink, ToComplete } from "@/components/legal/LegalLayout";
import { EDITOR, TO_COMPLETE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site et du service Onyx : éditeur, hébergement, propriété intellectuelle.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales">
      <LegalSection title="1. Éditeur du site">
        <p>
          Le site et le service Onyx (« le Service ») sont édités par <strong className="text-white">{EDITOR.name}</strong>,{" "}
          {EDITOR.status}, immatriculé sous le numéro SIREN <strong className="text-white">{EDITOR.siren}</strong>, dont
          le siège est situé <strong className="text-white">{EDITOR.address}</strong>.
        </p>
        <p>
          Le Service est proposé sous le régime de la franchise en base de TVA prévu à l’article 293 B du Code général
          des impôts : la TVA n’est pas applicable aux sommes facturées au titre de l’abonnement Onyx.
        </p>
        <p>
          Contact : <LegalLink href={`mailto:${EDITOR.email}`}>{EDITOR.email}</LegalLink>
        </p>
        <p>Directeur de la publication : {EDITOR.name}.</p>
      </LegalSection>

      <LegalSection title="2. Hébergement">
        <p>
          Le site est hébergé par <ToComplete>{TO_COMPLETE.hostName}</ToComplete>,{" "}
          <ToComplete>{TO_COMPLETE.hostAddress}</ToComplete>. La base de données est hébergée par{" "}
          <ToComplete>{TO_COMPLETE.databaseHost}</ToComplete>.
        </p>
      </LegalSection>

      <LegalSection title="3. Propriété intellectuelle">
        <p>
          L’ensemble des éléments du site Onyx (textes, graphismes, logo, code source, interface) est protégé par le
          droit de la propriété intellectuelle et demeure la propriété exclusive de l’éditeur, sauf mention contraire.
          Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation écrite
          préalable est interdite.
        </p>
        <p>
          Les données et documents (devis, factures, avoirs) créés par un utilisateur au moyen du Service restent sa
          propriété exclusive.
        </p>
      </LegalSection>

      <LegalSection title="4. Responsabilité">
        <p>
          L’éditeur s’efforce d’assurer l’exactitude des informations diffusées sur le site mais ne saurait être tenu
          responsable des erreurs, omissions ou indisponibilités temporaires. L’usage du Service est régi par les{" "}
          <LegalLink href="/cgu">Conditions Générales d’Utilisation</LegalLink> et les{" "}
          <LegalLink href="/cgv">Conditions Générales de Vente</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="5. Données personnelles et cookies">
        <p>
          Le traitement des données personnelles est décrit dans la{" "}
          <LegalLink href="/confidentialite">Politique de confidentialité</LegalLink> et l’usage des cookies dans la{" "}
          <LegalLink href="/cookies">Politique de cookies</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="6. Accessibilité">
        <p>
          La démarche d’accessibilité du site est présentée dans la{" "}
          <LegalLink href="/accessibilite">Déclaration d’accessibilité</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="7. Contact">
        <p>
          Pour toute question relative aux présentes mentions légales :{" "}
          <LegalLink href={`mailto:${EDITOR.email}`}>{EDITOR.email}</LegalLink>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

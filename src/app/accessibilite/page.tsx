import type { Metadata } from "next";
import { LegalLayout, LegalSection, LegalList, LegalLink } from "@/components/legal/LegalLayout";
import { EDITOR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Déclaration d’accessibilité",
  description: "Démarche d’accessibilité numérique d’Onyx, limites connues et moyen de signaler un défaut.",
};

export default function AccessibilitePage() {
  return (
    <LegalLayout title="Déclaration d’accessibilité">
      <LegalSection title="1. Notre engagement">
        <p>
          Onyx s’efforce de rendre son site et son application utilisables par le plus grand nombre, y compris par les
          personnes en situation de handicap, en s’appuyant sur les critères du référentiel général d’amélioration de
          l’accessibilité (RGAA) et sur les règles WCAG 2.1 niveau AA.
        </p>
      </LegalSection>

      <LegalSection title="2. État de conformité">
        <p>
          <strong className="text-white">Le niveau de conformité d’Onyx au RGAA n’a pas fait l’objet d’un audit
          complet par un tiers.</strong> Nous ne déclarons donc pas le site « conforme ». Des vérifications ont été
          effectuées et des corrections apportées :
        </p>
        <LegalList
          items={[
            "contrôle automatisé des pages avec l’outil axe-core (contraste des couleurs, étiquettes de formulaire, structure, repères de navigation) ;",
            "un titre unique par page, une langue déclarée, un lien d’évitement vers le contenu principal et des repères de navigation (en-tête, navigation, contenu principal, pied de page) ;",
            "des couleurs de texte respectant le contraste minimal de 4,5:1 (3:1 pour les grands textes) ;",
            "aucune image porteuse d’information sans alternative textuelle : les illustrations purement décoratives sont masquées aux lecteurs d’écran et les graphiques disposent d’une alternative textuelle ;",
            "une navigation possible au clavier, avec un indicateur de focus visible ;",
            "une réduction des animations pour les personnes qui l’ont demandée dans leur système.",
          ]}
        />
        <p>
          Ces contrôles automatisés ne détectent qu’une partie des défauts : un audit manuel reste nécessaire pour
          mesurer la conformité réelle.
        </p>
      </LegalSection>

      <LegalSection title="3. Limites connues">
        <LegalList
          items={[
            "Les documents PDF générés (devis, factures, avoirs) ne sont pas balisés pour les lecteurs d’écran (PDF/UA). Les factures et avoirs destinés à un client professionnel embarquent en outre un fichier XML structuré (Factur-X) lisible par des logiciels, mais ce n’est pas une alternative destinée aux personnes.",
            "Certains tableaux de données de l’application, très larges, nécessitent un défilement horizontal sur petit écran.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Signaler un défaut d’accessibilité">
        <p>
          Si vous ne parvenez pas à accéder à un contenu ou à une fonctionnalité, écrivez-nous à{" "}
          <LegalLink href={`mailto:${EDITOR.email}`}>{EDITOR.email}</LegalLink> en décrivant le problème et le
          navigateur ou la technologie d’assistance utilisés. Nous nous efforçons de répondre rapidement et de proposer
          une alternative.
        </p>
      </LegalSection>

      <LegalSection title="5. Voies de recours">
        <p>
          Si vous constatez un défaut d’accessibilité vous empêchant d’accéder à un contenu ou à un service et que notre
          réponse n’est pas satisfaisante, vous pouvez écrire au Défenseur des droits : sur{" "}
          <LegalLink href="https://formulaire.defenseurdesdroits.fr">formulaire.defenseurdesdroits.fr</LegalLink>, par
          téléphone au 09 69 39 00 00, ou par courrier (Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX 07).
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

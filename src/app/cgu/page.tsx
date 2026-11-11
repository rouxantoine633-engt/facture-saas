import type { Metadata } from "next";
import { LegalLayout, LegalSection, LegalList, LegalLink } from "@/components/legal/LegalLayout";
import { EDITOR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Conditions Générales d’Utilisation (CGU)",
  description: "Conditions Générales d’Utilisation du service Onyx : règles d’accès et d’usage du service.",
};

export default function CguPage() {
  return (
    <LegalLayout title="Conditions Générales d’Utilisation (CGU)">
      <LegalSection title="1. Objet et champ d’application">
        <p>
          Les présentes Conditions Générales d’Utilisation (« CGU ») définissent les règles d’accès et d’usage du service
          Onyx (« le Service »), une application en ligne de gestion de devis et de factures éditée par {EDITOR.name},{" "}
          {EDITOR.status}, SIREN {EDITOR.siren} (« l’Éditeur »). Elles s’appliquent à toute personne qui crée un compte
          et utilise le Service (« le Client »).
        </p>
        <p>
          Les conditions financières (prix, paiement, durée, résiliation, rétractation et remboursement) sont fixées
          par les <LegalLink href="/cgv">Conditions Générales de Vente (CGV)</LegalLink>, qui forment avec les
          présentes CGU l’ensemble contractuel applicable.
        </p>
      </LegalSection>

      <LegalSection title="2. Acceptation et évolution des CGU">
        <p>
          La création d’un compte est subordonnée à l’acceptation expresse des CGU et des CGV, au moyen d’une case à
          cocher. La version acceptée et la date d’acceptation sont conservées comme preuve de cet accord.
        </p>
        <p>
          L’Éditeur peut faire évoluer les CGU, notamment pour tenir compte d’évolutions légales ou fonctionnelles. Le
          Client est informé de toute modification substantielle avant son entrée en vigueur. S’il ne l’accepte pas, il
          peut résilier son abonnement dans les conditions prévues aux CGV ; la poursuite de l’utilisation du Service
          après l’entrée en vigueur de la nouvelle version vaut acceptation de celle-ci.
        </p>
      </LegalSection>

      <LegalSection title="3. Description du Service">
        <p>Onyx permet notamment de :</p>
        <LegalList
          items={[
            "enregistrer son entreprise et ses clients (particuliers ou professionnels) ;",
            "créer des devis, les convertir en factures et émettre des avoirs ;",
            "télécharger et envoyer par email ses documents au format PDF ; les factures et avoirs émis à destination d’un client professionnel sont produits au format Factur-X (PDF accompagné d’un fichier XML structuré) ;",
            "suivre les paiements et envoyer des relances automatiques pour les factures impayées ;",
            "exporter un journal des ventes et des encaissements, et préparer les données d’e-reporting des ventes aux particuliers.",
          ]}
        />
        <p>
          <strong className="text-white">Limites importantes.</strong> Onyx n’est pas une plateforme agréée de
          dématérialisation partenaire de l’administration fiscale : il ne transmet aucune facture ni aucune donnée à
          l’administration. Il prépare des documents et des fichiers que le Client peut fournir à la plateforme de son
          choix. Les fichiers d’e-reporting sont des données préparatoires, non des flux officiels.
        </p>
      </LegalSection>

      <LegalSection title="4. Compte utilisateur">
        <p>
          L’accès au Service nécessite un compte, créé avec une adresse email valide et un mot de passe. Le Client
          fournit des informations exactes et à jour, protège la confidentialité de ses identifiants et signale sans
          délai à l’Éditeur toute utilisation non autorisée de son compte. Toute action réalisée depuis le compte est
          réputée effectuée par son titulaire.
        </p>
      </LegalSection>

      <LegalSection title="5. Obligations du Client">
        <LegalList
          items={[
            "Le Client est seul responsable de l’exactitude des informations qu’il saisit (identité de son entreprise, régime de TVA, mentions légales, données de ses propres clients, prix, taux de TVA) et de la conformité de ses documents à la réglementation qui lui est applicable.",
            "Une facture émise est définitive : elle est numérotée, ses mentions sont figées et elle ne peut plus être modifiée. Toute correction passe par un avoir.",
            "Le Client s’interdit tout usage illicite ou détourné du Service, toute tentative d’accès non autorisé, de perturbation ou de contournement des mesures de sécurité, ainsi que la revente ou la mise à disposition du Service à des tiers.",
            "Le Client est invité à faire valider son usage du Service par son expert-comptable ou un conseil juridique.",
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Données du Client et de ses propres clients">
        <p>
          Les devis, factures, avoirs et fiches clients créés par le Client restent sa propriété. Il peut à tout moment
          en exporter une copie complète depuis la page « Mes données » de son compte.
        </p>
        <p>
          Pour les données de ses propres clients, le Client est responsable de traitement et l’Éditeur agit en qualité
          de sous-traitant : il les traite uniquement pour fournir le Service et sur instruction du Client, comme
          détaillé dans la <LegalLink href="/confidentialite">Politique de confidentialité</LegalLink>. Il appartient au
          Client d’informer ses clients de ce traitement.
        </p>
        <p>
          En cas de suppression du compte, les factures et avoirs déjà émis sont conservés dix ans, conformément à
          l’article L123-22 du Code de commerce, après anonymisation des données personnelles du titulaire.
        </p>
      </LegalSection>

      <LegalSection title="7. Disponibilité et maintenance">
        <p>
          L’Éditeur met en œuvre des moyens raisonnables pour assurer la disponibilité et la sécurité du Service, sans
          garantir une continuité absolue : des interruptions peuvent survenir pour maintenance ou en raison
          d’incidents techniques, notamment chez ses prestataires. L’Éditeur s’efforce d’en limiter la durée et
          l’impact.
        </p>
      </LegalSection>

      <LegalSection title="8. Propriété intellectuelle">
        <p>
          Le Service, son code, son interface, sa documentation et sa marque sont la propriété exclusive de l’Éditeur.
          Le Client bénéficie, pendant la durée de son abonnement, d’un droit d’usage personnel, non exclusif et non
          transférable du Service. Aucun droit de propriété intellectuelle sur le Service n’est cédé.
        </p>
      </LegalSection>

      <LegalSection title="9. Responsabilité">
        <p>
          Le Service est fourni « en l’état » dans la limite permise par la loi. L’Éditeur ne garantit pas que les
          documents générés soient exempts d’erreur ni qu’ils satisfassent, en toute circonstance, les obligations
          propres à l’activité du Client ; il n’est pas responsable des conséquences d’une saisie inexacte ou d’un
          usage non conforme.
        </p>
        <p>
          Sauf faute lourde ou dolosive, et sous réserve des dispositions impératives applicables aux consommateurs,
          la responsabilité de l’Éditeur est limitée aux sommes versées par le Client au titre des douze derniers mois
          d’abonnement. Rien dans les présentes ne limite les droits que la loi reconnaît au consommateur, notamment au
          titre de la garantie légale de conformité.
        </p>
      </LegalSection>

      <LegalSection title="10. Suspension pour manquement">
        <p>
          En cas de manquement grave du Client aux CGU (usage frauduleux, atteinte à la sécurité du Service,
          informations manifestement fausses), l’Éditeur peut suspendre ou résilier l’accès au Service, après mise en
          demeure restée sans effet lorsque les circonstances le permettent. La résiliation à l’initiative du Client
          est régie par les <LegalLink href="/cgv">CGV</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="11. Données personnelles, cookies et accessibilité">
        <p>
          Le traitement des données personnelles est décrit dans la{" "}
          <LegalLink href="/confidentialite">Politique de confidentialité</LegalLink>, l’usage des cookies dans la{" "}
          <LegalLink href="/cookies">Politique de cookies</LegalLink> et la démarche d’accessibilité dans la{" "}
          <LegalLink href="/accessibilite">Déclaration d’accessibilité</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="12. Droit applicable et litiges">
        <p>
          Les CGU sont soumises au droit français. En cas de difficulté, le Client est invité à contacter l’Éditeur
          pour rechercher une solution amiable. Les recours ouverts au consommateur (médiation, juridiction
          compétente) sont indiqués dans les <LegalLink href="/cgv">CGV</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>
          Pour toute question relative aux CGU : <LegalLink href={`mailto:${EDITOR.email}`}>{EDITOR.email}</LegalLink>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

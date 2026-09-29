import type { Metadata } from "next";
import { LegalLayout, LegalSection, LegalList } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation et de Vente — Onyx",
  description: "Conditions Générales d'Utilisation et de Vente du service Onyx.",
};

export default function CguPage() {
  return (
    <LegalLayout title="Conditions Générales d'Utilisation et de Vente" updatedAt="30 septembre 2026">
      <LegalSection title="1. Objet">
        <p>
          Les présentes Conditions Générales d&apos;Utilisation et de Vente (« CGU/CGV ») régissent l&apos;accès et
          l&apos;utilisation du service Onyx (« le Service »), une application de gestion de devis et de factures
          proposée en abonnement mensuel par Antoine ROUX, entrepreneur individuel, SIREN 105 801 179 (« l&apos;Éditeur »),
          accessible à l&apos;adresse du site. Elles s&apos;appliquent à tout utilisateur créant un compte sur le
          Service (« le Client »).
        </p>
      </LegalSection>

      <LegalSection title="2. Acceptation">
        <p>
          La création d&apos;un compte et l&apos;utilisation du Service impliquent l&apos;acceptation pleine et
          entière des présentes CGU/CGV. Si le Client n&apos;accepte pas tout ou partie de ces conditions, il ne
          doit pas utiliser le Service.
        </p>
      </LegalSection>

      <LegalSection title="3. Description du Service">
        <p>
          Onyx permet à ses utilisateurs — auto-entrepreneurs, artisans, consultants et petites entreprises
          françaises — de créer des devis, de les convertir en factures, de suivre leurs paiements, de générer des
          avoirs, d&apos;exporter un journal comptable et de recevoir des relances automatiques pour les factures
          impayées. Le Client reste seul responsable de l&apos;exactitude des informations qu&apos;il saisit
          (identité de son entreprise, régime de TVA applicable, informations relatives à ses propres clients) et
          de leur conformité aux obligations légales et fiscales qui lui incombent.
        </p>
      </LegalSection>

      <LegalSection title="4. Création de compte">
        <p>
          L&apos;accès au Service nécessite la création d&apos;un compte au moyen d&apos;une adresse email valide
          et d&apos;un mot de passe, ou via un compte Google. Le Client s&apos;engage à fournir des informations
          exactes et à préserver la confidentialité de ses identifiants. Toute action réalisée depuis un compte est
          réputée effectuée par le titulaire de ce compte.
        </p>
      </LegalSection>

      <LegalSection title="5. Tarifs et modalités de paiement">
        <LegalList
          items={[
            <>
              L&apos;abonnement au Service est proposé au tarif de <strong className="text-white">39 € par mois</strong>,
              sans engagement de durée.
            </>,
            <>
              Le paiement est prélevé automatiquement chaque mois, à la date anniversaire de la souscription, par
              carte bancaire via le prestataire de paiement Stripe.
            </>,
            <>
              L&apos;Éditeur étant soumis au régime de la franchise en base de TVA (article 293 B du CGI), le tarif
              indiqué s&apos;entend net de TVA.
            </>,
            <>
              À défaut de paiement à l&apos;échéance, l&apos;accès aux fonctionnalités payantes du Service peut être
              suspendu jusqu&apos;à régularisation, sans préjudice des tentatives de nouveau prélèvement
              automatique effectuées par Stripe.
            </>,
            <>L&apos;Éditeur se réserve le droit de modifier ses tarifs, moyennant un préavis raisonnable communiqué au Client avant toute nouvelle échéance de facturation.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Durée et résiliation">
        <p>
          L&apos;abonnement est conclu pour une durée indéterminée et se renouvelle tacitement chaque mois. Le
          Client peut résilier son abonnement à tout moment, sans frais ni justification, depuis la page « Mes
          données » de son compte. La résiliation prend effet à la fin de la période mensuelle déjà payée ; aucun
          remboursement au prorata n&apos;est effectué pour la période en cours, sauf disposition légale contraire.
        </p>
        <p>
          L&apos;Éditeur se réserve le droit de suspendre ou résilier l&apos;accès d&apos;un Client en cas de
          manquement grave aux présentes CGU/CGV (notamment usage frauduleux ou détourné du Service), après mise en
          demeure restée infructueuse lorsque cela est raisonnablement possible.
        </p>
      </LegalSection>

      <LegalSection title="7. Droit de rétractation">
        <p>
          Conformément à l&apos;article L221-18 du Code de la consommation, tout Client agissant en tant que
          consommateur (personne physique n&apos;agissant pas à titre professionnel) dispose d&apos;un délai de 14
          jours à compter de la souscription pour exercer son droit de rétractation, sans avoir à justifier de
          motif. En souscrivant à l&apos;abonnement et en demandant expressément l&apos;accès immédiat au Service, le
          Client reconnaît que son droit de rétractation prend fin dès lors que l&apos;exécution du Service a
          commencé avant la fin du délai de 14 jours, conformément à l&apos;article L221-28 13° du même code.
        </p>
      </LegalSection>

      <LegalSection title="8. Propriété intellectuelle">
        <p>
          Le Service, son code source, son interface et sa marque sont la propriété exclusive de l&apos;Éditeur.
          Aucune disposition des présentes CGU/CGV ne confère au Client de droit de propriété intellectuelle sur le
          Service.
        </p>
        <p>
          Les devis, factures, avoirs et données clients créés par le Client au moyen du Service demeurent sa
          propriété exclusive. Le Client peut à tout moment en exporter une copie complète depuis la page « Mes
          données ».
        </p>
      </LegalSection>

      <LegalSection title="9. Disponibilité et responsabilité">
        <p>
          L&apos;Éditeur met en œuvre des moyens raisonnables pour assurer la disponibilité et la sécurité du
          Service, sans garantie de continuité absolue (maintenance, incidents techniques indépendants de sa
          volonté). Le Service est fourni « en l&apos;état » ; l&apos;Éditeur ne garantit pas que les documents
          générés soient exempts de toute erreur ni qu&apos;ils satisfassent, en toute circonstance et pour tout
          régime fiscal, l&apos;ensemble des obligations légales applicables au Client — celui-ci demeure seul
          responsable de la conformité de sa facturation et de ses déclarations fiscales, et est invité à faire
          valider son usage du Service par un expert-comptable ou un conseil juridique.
        </p>
        <p>
          Dans les limites permises par la loi, la responsabilité de l&apos;Éditeur ne saurait être engagée au-delà
          des sommes effectivement versées par le Client au titre des douze derniers mois d&apos;abonnement, sauf
          faute lourde ou dolosive.
        </p>
      </LegalSection>

      <LegalSection title="10. Sous-traitants">
        <p>
          Pour le fonctionnement du Service, l&apos;Éditeur a recours aux prestataires suivants : Stripe (paiement
          et gestion des abonnements), Brevo (envoi des emails transactionnels), ainsi qu&apos;un hébergeur pour le
          site et la base de données (voir les{" "}
          <a href="/mentions-legales" className="text-indigo-300 underline underline-offset-2 hover:text-indigo-200">
            mentions légales
          </a>
          ). Le détail du traitement des données par ces sous-traitants figure dans la{" "}
          <a href="/confidentialite" className="text-indigo-300 underline underline-offset-2 hover:text-indigo-200">
            Politique de confidentialité
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="11. Modification des CGU/CGV">
        <p>
          L&apos;Éditeur peut modifier les présentes CGU/CGV à tout moment. Les Clients seront informés de toute
          modification substantielle ; la poursuite de l&apos;utilisation du Service après entrée en vigueur des
          nouvelles conditions vaut acceptation de celles-ci.
        </p>
      </LegalSection>

      <LegalSection title="12. Droit applicable et litiges">
        <p>
          Les présentes CGU/CGV sont soumises au droit français. En cas de litige, une solution amiable sera
          recherchée en priorité ; à défaut, les tribunaux français compétents seront seuls saisis, sous réserve
          des règles impératives applicables aux consommateurs.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>
          Pour toute question relative aux présentes CGU/CGV :{" "}
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

import type { Metadata } from "next";
import { LegalLayout, LegalSection, LegalList } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Onyx",
  description: "Politique de confidentialité et protection des données personnelles du service Onyx.",
};

export default function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité" updatedAt="29 septembre 2026">
      <LegalSection title="1. Responsable du traitement">
        <p>
          Le responsable du traitement des données à caractère personnel collectées via le service Onyx est{" "}
          <strong className="text-white">[Nom légal de l&apos;éditeur à compléter]</strong>, dont les coordonnées
          figurent dans les{" "}
          <a href="/mentions-legales" className="text-indigo-300 underline underline-offset-2 hover:text-indigo-200">
            mentions légales
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Données collectées">
        <p>Selon votre usage du Service, les données suivantes peuvent être collectées :</p>
        <LegalList
          items={[
            <>
              <strong className="text-white">Compte utilisateur</strong> : nom, adresse email, mot de passe
              (stocké sous forme hachée, jamais en clair).
            </>,
            <>
              <strong className="text-white">Profil entreprise</strong> : raison sociale, forme juridique, SIREN/
              SIRET, régime de TVA, adresse, coordonnées bancaires (IBAN/BIC), utilisés pour faire figurer les
              mentions légales obligatoires sur vos devis et factures.
            </>,
            <>
              <strong className="text-white">Données de vos propres clients</strong> : nom ou raison sociale,
              adresse, email, téléphone, que vous saisissez pour émettre vos devis et factures.
            </>,
            <>
              <strong className="text-white">Données de facturation de l&apos;abonnement</strong> : gérées
              directement par Stripe, notre prestataire de paiement — Onyx ne stocke jamais vos coordonnées
              bancaires personnelles.
            </>,
            <>
              <strong className="text-white">Données techniques</strong> : journal des actions effectuées sur vos
              documents (audit log), à des fins de traçabilité et de sécurité.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Finalités du traitement">
        <LegalList
          items={[
            "Fournir et faire fonctionner le Service (création de compte, génération des devis/factures/avoirs, envoi d'emails, relances de paiement).",
            "Gérer l'abonnement et la facturation via Stripe.",
            "Assurer la sécurité du Service et prévenir les usages frauduleux.",
            "Répondre à nos obligations légales, notamment la conservation des documents comptables pendant la durée requise par la loi.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Base légale">
        <p>
          Les traitements décrits ci-dessus reposent sur l&apos;exécution du contrat qui vous lie à Onyx
          (fourniture du Service), sur le respect d&apos;obligations légales (conservation des factures) et, le cas
          échéant, sur l&apos;intérêt légitime de l&apos;Éditeur à assurer la sécurité et le bon fonctionnement du
          Service.
        </p>
      </LegalSection>

      <LegalSection title="5. Destinataires et sous-traitants">
        <p>Vos données peuvent être transmises aux prestataires suivants, dans la stricte mesure nécessaire à leur mission :</p>
        <LegalList
          items={[
            <>
              <strong className="text-white">Stripe</strong> : traitement des paiements et gestion de
              l&apos;abonnement.
            </>,
            <>
              <strong className="text-white">Brevo</strong> : envoi des emails transactionnels (devis, factures,
              relances) en votre nom.
            </>,
            <>
              <strong className="text-white">Hébergeur</strong> : hébergement du site et de la base de données
              (voir les{" "}
              <a href="/mentions-legales" className="text-indigo-300 underline underline-offset-2 hover:text-indigo-200">
                mentions légales
              </a>
              ).
            </>,
          ]}
        />
        <p>
          <strong className="text-white">Vos données ne sont jamais vendues, louées ou cédées à des tiers à des
          fins commerciales ou publicitaires.</strong>
        </p>
      </LegalSection>

      <LegalSection title="6. Durée de conservation">
        <p>
          Vos données de compte et de profil sont conservées tant que votre compte est actif. En cas de suppression
          de votre compte :
        </p>
        <LegalList
          items={[
            "Si vous n'avez émis aucun devis ni facture, l'ensemble de vos données est supprimé immédiatement et définitivement.",
            <>
              Si vous avez émis au moins une facture ou un avoir, la loi impose leur conservation pendant{" "}
              <strong className="text-white">10 ans</strong> (article L123-22 du Code de commerce) : vos
              informations personnelles (identité, coordonnées, mot de passe) sont alors anonymisées, tandis que
              les factures et avoirs déjà émis restent conservés avec les mentions qu&apos;ils portaient au moment
              de leur émission, sans donnée vous concernant au-delà de ce qui y figurait déjà.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Sécurité">
        <p>
          Les mots de passe sont hachés (jamais stockés en clair), les échanges avec le Service sont chiffrés
          (HTTPS), et l&apos;accès à vos données est strictement réservé à votre compte. Les paiements sont traités
          exclusivement par Stripe, qui répond aux standards de sécurité du secteur bancaire (norme PCI-DSS).
        </p>
      </LegalSection>

      <LegalSection title="8. Vos droits">
        <p>
          Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et
          Libertés, vous disposez des droits suivants sur vos données personnelles : accès, rectification,
          effacement, limitation, opposition et portabilité.
        </p>
        <LegalList
          items={[
            <>
              <strong className="text-white">Accès et portabilité</strong> : téléchargez à tout moment une copie
              complète de vos données (profil, entreprise, clients, devis, factures, avoirs) au format JSON depuis
              la page « Mes données » de votre compte.
            </>,
            <>
              <strong className="text-white">Rectification</strong> : modifiez votre profil et vos informations
              d&apos;entreprise directement depuis votre compte.
            </>,
            <>
              <strong className="text-white">Effacement</strong> : supprimez votre compte depuis la page « Mes
              données » (suppression totale ou anonymisation selon les obligations de conservation légale
              détaillées ci-dessus).
            </>,
            <>
              <strong className="text-white">Réclamation</strong> : vous pouvez introduire une réclamation auprès
              de la Commission Nationale de l&apos;Informatique et des Libertés (CNIL) — <span className="text-white">www.cnil.fr</span>.
            </>,
          ]}
        />
        <p>
          Pour toute demande ne pouvant être satisfaite directement depuis votre compte, contactez-nous à{" "}
          <strong className="text-white">[adresse email de contact à compléter]</strong>.
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies">
        <p>
          Le Service utilise uniquement des cookies strictement nécessaires à son fonctionnement (maintien de votre
          session de connexion). Aucun cookie de suivi publicitaire ou de mesure d&apos;audience tiers n&apos;est
          déposé.
        </p>
      </LegalSection>

      <LegalSection title="10. Transferts hors Union européenne">
        <p>
          Certains de nos prestataires (Stripe, Brevo, hébergeur) peuvent être amenés à traiter des données en
          dehors de l&apos;Union européenne. Le cas échéant, ces transferts sont encadrés par les garanties prévues
          par le RGPD, notamment les clauses contractuelles types de la Commission européenne.
        </p>
      </LegalSection>

      <LegalSection title="11. Modification de la présente politique">
        <p>
          Cette politique de confidentialité peut être mise à jour pour refléter l&apos;évolution du Service ou de
          la réglementation. La date de dernière mise à jour figure en haut de cette page.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>
          Pour toute question relative à la protection de vos données :{" "}
          <strong className="text-white">[adresse email de contact à compléter]</strong>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

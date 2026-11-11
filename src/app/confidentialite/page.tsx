import type { Metadata } from "next";
import { LegalLayout, LegalSection, LegalList, LegalLink, ToComplete } from "@/components/legal/LegalLayout";
import { EDITOR, TO_COMPLETE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité du service Onyx : données collectées, finalités, bases légales, durées de conservation et droits RGPD.",
};

const TH = "border-b border-white/15 p-3 text-left font-medium text-white";
const TD = "border-b border-white/10 p-3 align-top";

export default function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <LegalSection title="1. Qui est responsable de vos données ?">
        <p>
          Le service Onyx est édité par <strong className="text-white">{EDITOR.name}</strong>, {EDITOR.status} (SIREN{" "}
          {EDITOR.siren}), {EDITOR.address}. Il intervient sous deux qualités :
        </p>
        <LegalList
          items={[
            <>
              <strong className="text-white">Responsable de traitement</strong> pour les données de votre compte, de
              votre entreprise et de votre abonnement ;
            </>,
            <>
              <strong className="text-white">Sous-traitant</strong> pour les données de vos propres clients (nom,
              adresse, email, téléphone, factures) que vous saisissez : vous en êtes le responsable de traitement, et
              Onyx les traite uniquement pour vous fournir le Service et selon vos instructions. Il vous appartient
              d’informer vos clients de ce traitement.
            </>,
          ]}
        />
        <p>
          Aucun délégué à la protection des données n’est désigné. Contact pour toute question :{" "}
          <LegalLink href={`mailto:${EDITOR.email}`}>{EDITOR.email}</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="2. Principe de minimisation">
        <p>
          Onyx ne collecte que les données nécessaires pour émettre des devis et des factures, suivre les paiements et
          gérer l’abonnement. <strong className="text-white">Aucun outil de mesure d’audience, de suivi
          publicitaire ou de profilage n’est utilisé</strong>, aucun script tiers n’est chargé sur le site, et les
          polices de caractères sont hébergées par Onyx (aucune requête vers un service de polices externe). Les champs
          facultatifs (téléphone, notes, IBAN, etc.) ne sont jamais exigés pour utiliser le Service.
        </p>
      </LegalSection>

      <LegalSection title="3. Données collectées">
        <LegalList
          items={[
            <>
              <strong className="text-white">Compte</strong> : nom, adresse email, mot de passe (conservé uniquement
              sous forme hachée), date et version des conditions acceptées à l’inscription (preuve de votre accord).
              Si vous vous connectez avec Google, nous recevons votre nom et votre adresse email ; aucun jeton d’accès
              Google n’est conservé.
            </>,
            <>
              <strong className="text-white">Entreprise</strong> : raison sociale, forme juridique, SIREN/SIRET, régime
              de TVA, adresse, email, éventuellement téléphone et coordonnées bancaires (IBAN/BIC) : mentions
              obligatoires ou utiles de vos factures.
            </>,
            <>
              <strong className="text-white">Vos clients</strong> : nom ou raison sociale, adresse, SIRET pour un client
              professionnel, et, de façon facultative, email, téléphone et notes ; ainsi que les devis, factures, avoirs
              et paiements correspondants.
            </>,
            <>
              <strong className="text-white">Abonnement</strong> : identifiants client et abonnement Stripe et statut de
              l’abonnement. Vos coordonnées bancaires sont saisies sur la page sécurisée de Stripe et ne sont jamais
              reçues ni conservées par Onyx.
            </>,
            <>
              <strong className="text-white">Journal d’activité</strong> : trace des actions importantes (émission d’une
              facture, envoi d’un email, modification de l’entreprise) à des fins de preuve et de sécurité.
            </>,
            <>
              <strong className="text-white">Données techniques</strong> : l’hébergeur peut journaliser temporairement
              des informations de connexion (adresse IP, date) nécessaires à la sécurité et au fonctionnement du site.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Finalités et bases légales">
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <caption className="sr-only">Finalités des traitements et base légale de chacun</caption>
            <thead>
              <tr>
                <th scope="col" className={TH}>
                  Finalité
                </th>
                <th scope="col" className={TH}>
                  Base légale (RGPD)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className={`${TD} text-left font-normal text-white`}>
                  Créer et gérer votre compte, fournir le Service (devis, factures, relances, exports)
                </th>
                <td className={TD}>Exécution du contrat (art. 6.1.b)</td>
              </tr>
              <tr>
                <th scope="row" className={`${TD} text-left font-normal text-white`}>
                  Gérer l’abonnement et son paiement
                </th>
                <td className={TD}>Exécution du contrat (art. 6.1.b)</td>
              </tr>
              <tr>
                <th scope="row" className={`${TD} text-left font-normal text-white`}>
                  Conserver les factures et avoirs émis pendant 10 ans, tenir la comptabilité de l’abonnement
                </th>
                <td className={TD}>Obligation légale (art. 6.1.c ; art. L123-22 du Code de commerce)</td>
              </tr>
              <tr>
                <th scope="row" className={`${TD} text-left font-normal text-white`}>
                  Sécurité du Service, prévention de la fraude, journal d’activité, preuve de l’acceptation des
                  conditions
                </th>
                <td className={TD}>Intérêt légitime (art. 6.1.f)</td>
              </tr>
              <tr>
                <th scope="row" className={`${TD} text-left font-normal text-white`}>
                  Cookies strictement nécessaires à la connexion
                </th>
                <td className={TD}>Exemptés de consentement (voir la politique de cookies)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Aucune de ces finalités ne repose sur votre consentement, et aucune décision automatisée produisant des effets
          juridiques n’est prise à votre égard. La fourniture des données de votre compte et de votre entreprise est
          nécessaire au Service : sans elles, nous ne pouvons pas émettre de factures conformes.
        </p>
      </LegalSection>

      <LegalSection title="5. Destinataires et sous-traitants">
        <p>
          Vos données ne sont ni vendues, ni louées, ni cédées à des fins commerciales ou publicitaires. Elles sont
          transmises, dans la stricte mesure nécessaire, aux prestataires suivants :
        </p>
        <LegalList
          items={[
            <>
              <strong className="text-white">Stripe</strong> : paiement et gestion de l’abonnement.
            </>,
            <>
              <strong className="text-white">Brevo</strong> : envoi des emails transactionnels (devis, factures,
              relances) que vous déclenchez ; l’email contient le document PDF de votre client.
            </>,
            <>
              <strong className="text-white">Hébergeur</strong> : <ToComplete>{TO_COMPLETE.hostName}</ToComplete> pour le
              site et <ToComplete>{TO_COMPLETE.databaseHost}</ToComplete> pour la base de données (voir les{" "}
              <LegalLink href="/mentions-legales">mentions légales</LegalLink>).
            </>,
          ]}
        />
        <p>
          Chaque prestataire intervient en qualité de sous-traitant au sens du RGPD. Hors obligation légale ou demande
          d’une autorité compétente, personne d’autre n’accède à vos données.
        </p>
      </LegalSection>

      <LegalSection title="6. Transferts hors Union européenne">
        <p>
          Certains prestataires (Stripe, l’hébergeur) peuvent traiter des données hors de l’Union européenne,
          notamment aux États-Unis. Ces transferts sont encadrés par les garanties prévues par le RGPD : décision
          d’adéquation de la Commission européenne ou clauses contractuelles types.
        </p>
      </LegalSection>

      <LegalSection title="7. Durées de conservation">
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <caption className="sr-only">Durée de conservation par catégorie de données</caption>
            <thead>
              <tr>
                <th scope="col" className={TH}>
                  Données
                </th>
                <th scope="col" className={TH}>
                  Durée
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className={`${TD} text-left font-normal text-white`}>
                  Compte, entreprise, clients, brouillons et devis
                </th>
                <td className={TD}>Tant que le compte est actif ; supprimés avec le compte.</td>
              </tr>
              <tr>
                <th scope="row" className={`${TD} text-left font-normal text-white`}>
                  Factures et avoirs émis
                </th>
                <td className={TD}>
                  10 ans à compter de leur émission, y compris après suppression du compte (alors anonymisé).
                </td>
              </tr>
              <tr>
                <th scope="row" className={`${TD} text-left font-normal text-white`}>
                  Pièces comptables de l’abonnement
                </th>
                <td className={TD}>10 ans (obligation comptable).</td>
              </tr>
              <tr>
                <th scope="row" className={`${TD} text-left font-normal text-white`}>
                  Cookie de session de connexion
                </th>
                <td className={TD}>30 jours au plus (voir la politique de cookies).</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          À la suppression du compte, si vous n’avez émis ni facture ni avoir, toutes vos données sont effacées
          immédiatement et définitivement. Sinon, votre identité, vos coordonnées et votre mot de passe sont anonymisés
          et votre connexion est révoquée ; les factures et avoirs conservent les mentions qu’ils portaient à leur
          émission. La suppression du compte met aussi fin à votre abonnement.
        </p>
      </LegalSection>

      <LegalSection title="8. Sécurité">
        <p>
          Les mots de passe sont hachés ; les échanges sont chiffrés (HTTPS) ; l’accès aux données est limité à votre
          compte ; les factures émises sont verrouillées contre toute modification. Les paiements sont traités
          exclusivement par Stripe.
        </p>
      </LegalSection>

      <LegalSection title="9. Vos droits">
        <p>
          Vous disposez, sur vos données, des droits d’accès, de rectification, d’effacement, de limitation,
          d’opposition et de portabilité, ainsi que du droit de définir des directives relatives à leur sort après
          votre décès.
        </p>
        <LegalList
          items={[
            <>
              <strong className="text-white">Accès et portabilité</strong> : téléchargez une copie complète de vos
              données au format JSON depuis la page « Mes données ».
            </>,
            <>
              <strong className="text-white">Rectification</strong> : modifiez votre profil, votre entreprise et vos
              clients directement dans l’application.
            </>,
            <>
              <strong className="text-white">Effacement</strong> : supprimez votre compte depuis « Mes données »
              (suppression ou anonymisation selon les obligations de conservation ci-dessus).
            </>,
            <>
              <strong className="text-white">Autres demandes</strong> : écrivez à{" "}
              <LegalLink href={`mailto:${EDITOR.email}`}>{EDITOR.email}</LegalLink>. Nous répondons dans un délai
              d’un mois.
            </>,
          ]}
        />
        <p>
          Si vous êtes le client d’un utilisateur d’Onyx, adressez vos demandes à ce dernier, responsable du traitement
          de vos données ; nous l’assisterons pour y répondre. Vous pouvez enfin introduire une réclamation auprès de la
          Commission nationale de l’informatique et des libertés (CNIL) :{" "}
          <LegalLink href="https://www.cnil.fr">www.cnil.fr</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="10. Cookies">
        <p>
          Onyx dépose uniquement des cookies strictement nécessaires à la connexion, exemptés de consentement. Aucun
          cookie de mesure d’audience ou de publicité n’est utilisé. Le détail figure dans la{" "}
          <LegalLink href="/cookies">Politique de cookies</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="11. Modification de cette politique">
        <p>
          Cette politique peut évoluer avec le Service ou la réglementation ; la date de dernière mise à jour figure en
          haut de la page. Toute modification importante est portée à la connaissance des utilisateurs.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

import type { Metadata } from "next";
import {
  LegalLayout,
  LegalSection,
  LegalSubsection,
  LegalList,
  LegalLink,
  ToComplete,
} from "@/components/legal/LegalLayout";
import { EDITOR, SUBSCRIPTION, TO_COMPLETE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente, rétractation et remboursement",
  description:
    "Conditions Générales de Vente d’Onyx : prix, paiement, résiliation, droit de rétractation et conditions de remboursement.",
};

export default function CgvPage() {
  const { priceEuros, withdrawalDays } = SUBSCRIPTION;
  return (
    <LegalLayout title="Conditions Générales de Vente (CGV)">
      <nav aria-label="Sommaire" className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm">
        <p className="font-medium text-white">Accès direct</p>
        <ul className="mt-2 space-y-1">
          <li>
            <LegalLink href="#retractation">Droit de rétractation (article 7)</LegalLink>
          </li>
          <li>
            <LegalLink href="#remboursement">Conditions de remboursement (article 8)</LegalLink>
          </li>
          <li>
            <LegalLink href="#formulaire">Modèle de formulaire de rétractation (annexe)</LegalLink>
          </li>
        </ul>
      </nav>

      <LegalSection title="1. Vendeur et champ d’application">
        <p>
          Les présentes Conditions Générales de Vente (« CGV ») régissent la vente de l’abonnement au service Onyx par{" "}
          {EDITOR.name}, {EDITOR.status}, SIREN {EDITOR.siren}, {EDITOR.address} (« le Vendeur »), à toute personne qui
          souscrit un abonnement (« le Client »). Elles complètent les{" "}
          <LegalLink href="/cgu">Conditions Générales d’Utilisation</LegalLink>. Contact :{" "}
          <LegalLink href={`mailto:${EDITOR.email}`}>{EDITOR.email}</LegalLink>.
        </p>
        <p>
          Le Service est conçu pour des professionnels (auto-entrepreneurs, artisans, indépendants, très petites
          entreprises). Les dispositions réservées au consommateur, c’est-à-dire à toute personne physique qui n’agit
          pas à des fins professionnelles (articles 7, 8 et 10), s’appliquent dans ce cas uniquement.
        </p>
      </LegalSection>

      <LegalSection title="2. Caractéristiques du service">
        <p>
          L’abonnement donne accès à l’ensemble des fonctionnalités d’Onyx décrites dans les CGU : devis, factures,
          avoirs, suivi des paiements, relances, exports et préparation des données d’e-reporting. Le Client est
          informé, avant de souscrire, des fonctionnalités et des limites du Service décrites sur le site et dans les
          CGU (notamment : Onyx n’est pas une plateforme agréée et ne transmet rien à l’administration).
        </p>
      </LegalSection>

      <LegalSection title="3. Prix">
        <p>
          L’abonnement est proposé au prix de <strong className="text-white">{priceEuros} € par mois</strong>, sans
          engagement de durée. Le Vendeur relevant du régime de la franchise en base de TVA (article 293 B du Code
          général des impôts), la TVA n’est pas applicable : le prix est le même toutes taxes comprises.
        </p>
        <p>
          Le Vendeur peut modifier son tarif. Toute modification est notifiée au Client avant sa prochaine échéance ; le
          Client qui la refuse peut résilier avant cette échéance et ne se verra pas appliquer le nouveau prix.
        </p>
      </LegalSection>

      <LegalSection title="4. Commande">
        <p>La commande se déroule en plusieurs étapes, avant tout paiement :</p>
        <LegalList
          items={[
            "création du compte, après acceptation expresse des CGU et des CGV ;",
            "renseignement du profil de l’entreprise ;",
            <>
              clic sur le bouton « S’abonner avec obligation de paiement — {priceEuros} € / mois », qui conduit à la page de paiement sécurisée de
              Stripe, où le Client vérifie sa commande avant de la valider. Ce bouton emporte{" "}
              <strong className="text-white">obligation de paiement</strong> ;
            </>,
            "confirmation de l’abonnement, adressée par Stripe, puis activation de l’accès.",
          ]}
        />
        <p>Le Client peut corriger ses informations avant de valider le paiement.</p>
      </LegalSection>

      <LegalSection title="5. Paiement">
        <LegalList
          items={[
            "Le paiement s’effectue par carte bancaire, via le prestataire de paiement Stripe. Le Vendeur ne conserve aucune coordonnée bancaire.",
            "L’abonnement est prélevé automatiquement chaque mois, à la date anniversaire de la souscription, jusqu’à résiliation.",
            "En cas d’échec de paiement, Stripe peut retenter le prélèvement. À défaut de régularisation, l’accès aux fonctionnalités payantes peut être suspendu jusqu’au paiement.",
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Durée, renouvellement et résiliation">
        <p>
          L’abonnement est conclu pour un mois et se renouvelle tacitement de mois en mois. Le Client peut le résilier à
          tout moment, sans frais ni justification, en écrivant à{" "}
          <LegalLink href={`mailto:${EDITOR.email}`}>{EDITOR.email}</LegalLink> depuis l’adresse de son compte. La
          résiliation prend effet à la fin de la période mensuelle en cours ; le Client conserve son accès jusqu’à cette
          date et aucun prélèvement ultérieur n’a lieu.
        </p>
        <p>
          La suppression du compte depuis la page « Mes données » met fin immédiatement à l’abonnement et à tout
          prélèvement futur. Elle n’ouvre pas droit au remboursement de la période déjà payée, sauf dans les cas prévus
          à l’article 8.
        </p>
      </LegalSection>

      <section id="retractation" className="scroll-mt-8">
        <h2 className="text-xl font-semibold text-white">7. Droit de rétractation du consommateur</h2>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-white/75">
          <LegalSubsection title="7.1 Principe">
            <p>
              Le Client consommateur dispose de <strong className="text-white">{withdrawalDays} jours</strong> à compter
              de la conclusion du contrat (c’est-à-dire de la souscription à l’abonnement) pour se rétracter, sans avoir
              à motiver sa décision et sans pénalité (articles L221-18 et suivants du Code de la consommation).
            </p>
            <p>
              Le Client qui agit à des fins professionnelles ne bénéficie pas du droit légal de rétractation prévu par le
              Code de la consommation.
            </p>
          </LegalSubsection>

          <LegalSubsection title="7.2 Comment se rétracter">
            <p>
              Le Client informe le Vendeur de sa décision par une déclaration dénuée d’ambiguïté, adressée à{" "}
              <LegalLink href={`mailto:${EDITOR.email}`}>{EDITOR.email}</LegalLink> ou par courrier à {EDITOR.address}. Il
              peut utiliser le <LegalLink href="#formulaire">modèle de formulaire</LegalLink> en annexe, sans que ce soit
              obligatoire. Le délai est respecté si la communication est envoyée avant son expiration.
            </p>
          </LegalSubsection>

          <LegalSubsection title="7.3 Accès immédiat au service et paiement proportionnel">
            <p>
              Le Service est mis à disposition dès la souscription. Si le Client consommateur demande expressément que
              l’accès commence avant la fin du délai de rétractation, ce qui est le cas lorsqu’il utilise le Service
              après avoir validé sa commande, il reste libre de se rétracter mais doit payer un montant proportionnel à
              ce qui lui a été fourni jusqu’à la communication de sa décision, par rapport à l’ensemble des prestations
              prévues (article L221-25 du Code de la consommation).
            </p>
            <p>
              Ce montant est calculé au prorata du nombre de jours écoulés depuis la souscription, sur la base de la
              mensualité de {priceEuros} €. Il n’est dû aucun montant si le Client n’a pas demandé l’accès immédiat au
              Service ou s’il ne l’a pas utilisé.
            </p>
          </LegalSubsection>
        </div>
      </section>

      <section id="remboursement" className="scroll-mt-8">
        <h2 className="text-xl font-semibold text-white">8. Conditions de remboursement</h2>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-white/75">
          <LegalSubsection title="8.1 Cas de remboursement">
            <LegalList
              items={[
                <>
                  <strong className="text-white">Rétractation du consommateur dans le délai de {withdrawalDays} jours</strong> :
                  remboursement de toutes les sommes versées, sous déduction du montant proportionnel prévu à l’article
                  7.3 le cas échéant.
                </>,
                <>
                  <strong className="text-white">Erreur de facturation</strong> (prélèvement en double, montant
                  différent de celui annoncé, prélèvement postérieur à une résiliation ou à une suppression de compte) :
                  remboursement intégral de la somme indûment prélevée.
                </>,
                "Tout autre remboursement auquel le Client peut prétendre en application de la loi, notamment au titre de la garantie légale de conformité (article 9).",
              ]}
            />
          </LegalSubsection>

          <LegalSubsection title="8.2 Cas sans remboursement">
            <p>
              En dehors de ces cas, la résiliation ou la suppression du compte à l’initiative du Client ne donne pas
              lieu au remboursement de la période mensuelle déjà payée ni à un remboursement au prorata : le Client
              conserve son accès jusqu’à la fin de cette période en cas de résiliation.
            </p>
          </LegalSubsection>

          <LegalSubsection title="8.3 Modalités">
            <p>
              Le Client adresse sa demande à <LegalLink href={`mailto:${EDITOR.email}`}>{EDITOR.email}</LegalLink> en
              indiquant l’adresse email de son compte. Le Vendeur rembourse le Client au plus tard{" "}
              <strong className="text-white">{withdrawalDays} jours</strong> après avoir été informé de sa décision de
              se rétracter, et dans le même délai pour les autres cas, par le même moyen de paiement que celui utilisé
              pour la commande, sans frais pour le Client.
            </p>
          </LegalSubsection>
        </div>
      </section>

      <LegalSection title="9. Garanties légales">
        <p>
          Le Client consommateur bénéficie de la garantie légale de conformité applicable aux contenus et services
          numériques (articles L224-25-1 et suivants du Code de la consommation). Elle s’applique indépendamment de
          toute garantie commerciale et peut conduire, selon les cas, à la mise en conformité du Service, à une
          réduction du prix ou à la résolution du contrat.
        </p>
      </LegalSection>

      <LegalSection title="10. Médiation de la consommation">
        <p>
          Tout litige n’ayant pu être résolu directement avec le Vendeur peut être soumis, par le Client consommateur et
          gratuitement, au médiateur de la consommation dont relève le Vendeur :{" "}
          <ToComplete>{TO_COMPLETE.consumerMediator}</ToComplete>. Le Client peut aussi recourir à la plateforme
          européenne de règlement en ligne des litiges, accessible à l’adresse{" "}
          <LegalLink href="https://ec.europa.eu/consumers/odr">ec.europa.eu/consumers/odr</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="11. Droit applicable et juridiction">
        <p>
          Les CGV sont soumises au droit français. Le Client consommateur peut saisir, à son choix, la juridiction du
          lieu où il demeure ou celle du lieu du fait dommageable. Pour un Client professionnel, et à défaut d’accord
          amiable, les tribunaux compétents du ressort du siège du Vendeur sont seuls compétents.
        </p>
      </LegalSection>

      <section id="formulaire" className="scroll-mt-8">
        <h2 className="text-xl font-semibold text-white">Annexe : modèle de formulaire de rétractation</h2>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-white/75">
          <p>
            (À compléter et à renvoyer uniquement si vous souhaitez vous rétracter du contrat.) À l’attention de{" "}
            {EDITOR.name}, {EDITOR.address}, <LegalLink href={`mailto:${EDITOR.email}`}>{EDITOR.email}</LegalLink> :
          </p>
          <LegalList
            items={[
              "Je/nous vous notifie/notifions par la présente ma/notre rétractation du contrat portant sur la prestation de services ci-dessous : abonnement au service Onyx ;",
              "Commandé le : ______________ ;",
              "Nom du ou des consommateur(s) : ______________ ;",
              "Adresse du ou des consommateur(s) : ______________ ;",
              "Adresse email du compte Onyx : ______________ ;",
              "Signature du ou des consommateur(s) (uniquement en cas de notification du présent formulaire sur papier) : ______________ ;",
              "Date : ______________.",
            ]}
          />
        </div>
      </section>
    </LegalLayout>
  );
}

import type { Metadata } from "next";
import { LegalLayout, LegalSection, LegalList, LegalLink } from "@/components/legal/LegalLayout";
import { EDITOR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Politique de cookies",
  description: "Les cookies déposés par Onyx : uniquement des cookies strictement nécessaires à la connexion, sans suivi.",
};

const TH = "border-b border-white/15 p-3 text-left font-medium text-white";
const TD = "border-b border-white/10 p-3 align-top";

export default function CookiesPage() {
  return (
    <LegalLayout title="Politique de cookies">
      <LegalSection title="1. En bref">
        <p>
          <strong className="text-white">Onyx n’utilise aucun cookie de mesure d’audience, de publicité ou de suivi.</strong>{" "}
          Seuls trois cookies techniques, indispensables à la connexion et à la sécurité, sont déposés lorsque vous
          utilisez la connexion ou l’inscription. Ils sont exemptés de consentement : c’est pourquoi le site n’affiche
          pas de bandeau de choix des cookies, qui n’aurait rien à vous demander.
        </p>
        <p>Les pages d’information (accueil, pages légales) ne déposent aucun cookie.</p>
      </LegalSection>

      <LegalSection title="2. Cookies déposés">
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <caption className="sr-only">Liste des cookies déposés par Onyx</caption>
            <thead>
              <tr>
                <th scope="col" className={TH}>
                  Nom
                </th>
                <th scope="col" className={TH}>
                  Rôle
                </th>
                <th scope="col" className={TH}>
                  Durée
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className={`${TD} text-left font-mono text-xs font-normal text-white`}>
                  authjs.session-token
                </th>
                <td className={TD}>Maintient votre session de connexion une fois authentifié.</td>
                <td className={TD}>30 jours au plus</td>
              </tr>
              <tr>
                <th scope="row" className={`${TD} text-left font-mono text-xs font-normal text-white`}>
                  authjs.csrf-token
                </th>
                <td className={TD}>Protège les formulaires de connexion contre les requêtes frauduleuses (CSRF).</td>
                <td className={TD}>Session (supprimé à la fermeture du navigateur)</td>
              </tr>
              <tr>
                <th scope="row" className={`${TD} text-left font-mono text-xs font-normal text-white`}>
                  authjs.callback-url
                </th>
                <td className={TD}>Mémorise la page à afficher après la connexion.</td>
                <td className={TD}>Session (supprimé à la fermeture du navigateur)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Sur le site en production, ces noms peuvent être précédés du préfixe « __Secure- » ou « __Host- » (cookies
          réservés aux connexions HTTPS). Tous sont déposés par Onyx lui-même (aucun cookie tiers), inaccessibles aux
          scripts de la page (HttpOnly) et limités à Onyx (SameSite=Lax).
        </p>
      </LegalSection>

      <LegalSection title="3. Paiement par Stripe">
        <p>
          Lorsque vous vous abonnez, vous êtes redirigé vers la page de paiement hébergée par Stripe. Cette page relève
          de Stripe, qui y dépose ses propres cookies nécessaires à la sécurité du paiement et à la prévention de la
          fraude, selon sa propre politique. Onyx ne dépose ni ne lit ces cookies.
        </p>
      </LegalSection>

      <LegalSection title="4. Pourquoi pas de bandeau ?">
        <p>
          La loi (article 82 de la loi Informatique et Libertés, recommandations de la CNIL) exige votre consentement
          pour déposer ou lire des informations sur votre terminal, sauf lorsque cela est strictement nécessaire à la
          fourniture d’un service que vous demandez expressément, comme l’ouverture d’une session de connexion. Onyx
          n’utilise que de tels cookies. Si un outil de mesure d’audience ou un service tiers devait être ajouté, un
          mécanisme de consentement (avec refus aussi simple que l’acceptation) serait mis en place avant tout dépôt, et
          cette page serait mise à jour.
        </p>
      </LegalSection>

      <LegalSection title="5. Gérer les cookies">
        <p>
          Vous pouvez supprimer ou bloquer les cookies depuis les réglages de votre navigateur. Bloquer les cookies
          techniques d’Onyx vous empêchera toutefois de vous connecter. Les informations conservées dans le navigateur
          sont limitées à ces trois cookies : Onyx n’utilise ni le stockage local ni d’identifiant publicitaire.
        </p>
        <LegalList
          items={[
            <>
              Pour toute question : <LegalLink href={`mailto:${EDITOR.email}`}>{EDITOR.email}</LegalLink>.
            </>,
            <>
              Pour en savoir plus sur les cookies : <LegalLink href="https://www.cnil.fr/fr/cookies-et-autres-traceurs">cnil.fr</LegalLink>.
            </>,
          ]}
        />
      </LegalSection>
    </LegalLayout>
  );
}

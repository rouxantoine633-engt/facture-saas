import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";

/**
 * Minimisation des données (RGPD) : l'application n'utilise Google que pour authentifier l'utilisateur,
 * jamais pour appeler une API Google en son nom. Les jetons OAuth (accès, rafraîchissement, identité) et la
 * photo de profil seraient donc conservés sans aucune finalité : on ne les enregistre pas.
 */
export function minimizedAdapter(base: Adapter): Adapter {
  return {
    ...base,
    createUser: (user: AdapterUser) => base.createUser!({ ...user, image: null }),
    linkAccount: (account: AdapterAccount) =>
      base.linkAccount!({
        ...account,
        access_token: undefined,
        refresh_token: undefined,
        id_token: undefined,
      }),
  };
}

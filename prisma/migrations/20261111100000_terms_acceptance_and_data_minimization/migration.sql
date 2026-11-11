-- AlterTable : preuve d'acceptation des CGU/CGV à l'inscription
ALTER TABLE "users" ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "termsVersion" TEXT;

-- Minimisation des données (RGPD) : l'application ne se sert de Google que pour authentifier, jamais pour
-- appeler ses API. Les jetons OAuth et la photo de profil sont donc inutiles et ne sont plus conservés.
UPDATE "accounts" SET "access_token" = NULL, "refresh_token" = NULL, "id_token" = NULL;
UPDATE "users" SET "image" = NULL;

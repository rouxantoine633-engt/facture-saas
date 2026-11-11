-- AlterTable : mentions légales du pied de page des documents (code NAF/APE, Répertoire des métiers)
ALTER TABLE "companies" ADD COLUMN     "nafCode" VARCHAR(5),
ADD COLUMN     "rmCity" TEXT,
ADD COLUMN     "rmNumber" TEXT;

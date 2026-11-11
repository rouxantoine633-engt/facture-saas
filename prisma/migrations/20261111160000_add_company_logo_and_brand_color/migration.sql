-- AlterTable : couleur principale des rapports PDF
ALTER TABLE "companies" ADD COLUMN     "brandColor" VARCHAR(7);

-- CreateTable : logo de l'entreprise (table séparée pour ne pas alourdir la lecture de l'entreprise)
CREATE TABLE "company_logos" (
    "companyId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_logos_pkey" PRIMARY KEY ("companyId")
);

-- AddForeignKey
ALTER TABLE "company_logos" ADD CONSTRAINT "company_logos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

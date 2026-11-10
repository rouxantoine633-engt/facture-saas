-- CreateEnum
CREATE TYPE "OperationCategory" AS ENUM ('LIVRAISON_BIENS', 'PRESTATION_SERVICES', 'MIXTE');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "operationCategory" "OperationCategory" NOT NULL DEFAULT 'PRESTATION_SERVICES';

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "operationCategory" "OperationCategory" NOT NULL DEFAULT 'PRESTATION_SERVICES';

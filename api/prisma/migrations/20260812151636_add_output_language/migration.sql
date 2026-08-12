-- CreateEnum
CREATE TYPE "output_language" AS ENUM ('pt_BR', 'en_US');

-- AlterTable
ALTER TABLE "assistant_profiles" ADD COLUMN     "output_language" "output_language" NOT NULL DEFAULT 'pt_BR';

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "monthly_budget" DECIMAL(15,2);

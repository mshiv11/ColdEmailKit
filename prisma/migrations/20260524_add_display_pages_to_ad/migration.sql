-- AlterEnum
ALTER TYPE "AdType" ADD VALUE 'TopBar';

-- AlterTable
ALTER TABLE "Ad" ADD COLUMN "displayPages" TEXT[] DEFAULT ARRAY[]::TEXT[];

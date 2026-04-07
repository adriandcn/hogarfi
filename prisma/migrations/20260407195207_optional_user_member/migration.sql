-- AlterTable
ALTER TABLE "HouseholdMember" ADD COLUMN     "name" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "memberId" TEXT;

-- AlterEnum
ALTER TYPE "SignalEventType" ADD VALUE 'owner_changed';

-- AlterTable
ALTER TABLE "Signal" ADD COLUMN     "ownerId" TEXT;

-- CreateIndex
CREATE INDEX "Signal_ownerId_idx" ON "Signal"("ownerId");

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

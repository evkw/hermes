-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SignalEventType" ADD VALUE 'checklist_item_added';
ALTER TYPE "SignalEventType" ADD VALUE 'checklist_item_completed';
ALTER TYPE "SignalEventType" ADD VALUE 'checklist_item_uncompleted';

-- CreateTable
CREATE TABLE "SignalChecklistItem" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "SignalChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SignalChecklistItem_signalId_idx" ON "SignalChecklistItem"("signalId");

-- AddForeignKey
ALTER TABLE "SignalChecklistItem" ADD CONSTRAINT "SignalChecklistItem_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

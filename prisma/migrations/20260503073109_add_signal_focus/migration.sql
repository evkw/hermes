-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SignalEventType" ADD VALUE 'focused';
ALTER TYPE "SignalEventType" ADD VALUE 'unfocused';
ALTER TYPE "SignalEventType" ADD VALUE 'focus_displaced';

-- AlterTable
ALTER TABLE "Signal" ADD COLUMN     "focusedAt" TIMESTAMP(3),
ADD COLUMN     "isFocused" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Signal_isFocused_idx" ON "Signal"("isFocused");

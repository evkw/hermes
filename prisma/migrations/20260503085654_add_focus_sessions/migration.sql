-- AlterEnum
ALTER TYPE "SignalEventType" ADD VALUE 'focus_session_completed';

-- CreateTable
CREATE TABLE "FocusSession" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMinutes" INTEGER NOT NULL,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "FocusSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FocusSession_signalId_idx" ON "FocusSession"("signalId");

-- CreateIndex
CREATE INDEX "FocusSession_endedAt_idx" ON "FocusSession"("endedAt");

-- AddForeignKey
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

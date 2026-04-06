-- CreateEnum
CREATE TYPE "SignalStatus" AS ENUM ('active', 'resolved');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('active', 'at_risk', 'needs_attention');

-- CreateEnum
CREATE TYPE "SignalEventType" AS ENUM ('created', 'note_added', 'worked_today', 'risk_increased', 'resolved', 'reopened', 'link_attached', 'edited');

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SignalStatus" NOT NULL DEFAULT 'active',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastWorkedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "focusedOnDate" TIMESTAMP(3),

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalEvent" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "eventType" "SignalEventType" NOT NULL,
    "note" TEXT,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Signal_status_idx" ON "Signal"("status");

-- CreateIndex
CREATE INDEX "Signal_riskLevel_idx" ON "Signal"("riskLevel");

-- CreateIndex
CREATE INDEX "Signal_focusedOnDate_idx" ON "Signal"("focusedOnDate");

-- CreateIndex
CREATE INDEX "Signal_lastWorkedAt_idx" ON "Signal"("lastWorkedAt");

-- CreateIndex
CREATE INDEX "Signal_createdAt_idx" ON "Signal"("createdAt");

-- CreateIndex
CREATE INDEX "SignalEvent_signalId_idx" ON "SignalEvent"("signalId");

-- CreateIndex
CREATE INDEX "SignalEvent_createdAt_idx" ON "SignalEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SignalEvent_signalId_createdAt_idx" ON "SignalEvent"("signalId", "createdAt");

-- AddForeignKey
ALTER TABLE "SignalEvent" ADD CONSTRAINT "SignalEvent_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

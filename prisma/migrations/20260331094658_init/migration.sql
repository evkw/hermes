-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "riskLevel" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastWorkedAt" DATETIME,
    "resolvedAt" DATETIME,
    "focusedOnDate" DATETIME
);

-- CreateTable
CREATE TABLE "SignalEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "signalId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "note" TEXT,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SignalEvent_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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

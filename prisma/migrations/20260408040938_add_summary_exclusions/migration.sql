-- CreateTable
CREATE TABLE "SummaryExclusion" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SummaryExclusion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SummaryExclusion_signalId_idx" ON "SummaryExclusion"("signalId");

-- CreateIndex
CREATE INDEX "SummaryExclusion_date_idx" ON "SummaryExclusion"("date");

-- CreateIndex
CREATE UNIQUE INDEX "SummaryExclusion_signalId_date_key" ON "SummaryExclusion"("signalId", "date");

-- AddForeignKey
ALTER TABLE "SummaryExclusion" ADD CONSTRAINT "SummaryExclusion_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

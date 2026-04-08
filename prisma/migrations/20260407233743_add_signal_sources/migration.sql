-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('manual', 'teams', 'gitlab', 'jira', 'url_other');

-- AlterEnum
ALTER TYPE "SignalEventType" ADD VALUE 'source_added';

-- CreateTable
CREATE TABLE "SignalSource" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignalSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SignalSource_signalId_idx" ON "SignalSource"("signalId");

-- CreateIndex
CREATE INDEX "SignalSource_type_idx" ON "SignalSource"("type");

-- AddForeignKey
ALTER TABLE "SignalSource" ADD CONSTRAINT "SignalSource_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Convert SignalSource.type from SourceType enum to plain text
ALTER TABLE "SignalSource" ALTER COLUMN "type" SET DATA TYPE TEXT USING "type"::TEXT;

-- Drop the SourceType enum (no longer needed)
DROP TYPE "SourceType";

-- CreateTable
CREATE TABLE "OriginMapping" (
    "id" TEXT NOT NULL,
    "matchValue" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OriginMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OriginMapping_matchValue_key" ON "OriginMapping"("matchValue");

-- CreateIndex
CREATE INDEX "OriginMapping_matchValue_idx" ON "OriginMapping"("matchValue");

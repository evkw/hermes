-- AlterEnum
ALTER TYPE "SignalEventType" ADD VALUE 'streams_changed';

-- CreateTable
CREATE TABLE "Stream" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SignalToStream" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SignalToStream_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stream_key_key" ON "Stream"("key");

-- CreateIndex
CREATE INDEX "Stream_key_idx" ON "Stream"("key");

-- CreateIndex
CREATE INDEX "_SignalToStream_B_index" ON "_SignalToStream"("B");

-- AddForeignKey
ALTER TABLE "_SignalToStream" ADD CONSTRAINT "_SignalToStream_A_fkey" FOREIGN KEY ("A") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SignalToStream" ADD CONSTRAINT "_SignalToStream_B_fkey" FOREIGN KEY ("B") REFERENCES "Stream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

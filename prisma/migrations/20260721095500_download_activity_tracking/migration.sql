-- CreateEnum
CREATE TYPE "DownloadActivityType" AS ENUM ('QR_GENERATED', 'QR_SCANNED', 'EMAIL_SENT');

-- AlterTable
ALTER TABLE "Download" ADD COLUMN "downloadCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DownloadActivity" (
    "id" TEXT NOT NULL,
    "downloadId" TEXT NOT NULL,
    "tokenId" TEXT,
    "type" "DownloadActivityType" NOT NULL,
    "recipientEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DownloadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DownloadActivity_downloadId_createdAt_idx" ON "DownloadActivity"("downloadId", "createdAt");

-- CreateIndex
CREATE INDEX "DownloadActivity_type_createdAt_idx" ON "DownloadActivity"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "DownloadActivity" ADD CONSTRAINT "DownloadActivity_downloadId_fkey" FOREIGN KEY ("downloadId") REFERENCES "Download"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadActivity" ADD CONSTRAINT "DownloadActivity_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "DownloadToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

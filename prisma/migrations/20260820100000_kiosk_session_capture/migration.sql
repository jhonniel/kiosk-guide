-- CreateTable
CREATE TABLE "KioskSessionCapture" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "language" TEXT,
    "imagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KioskSessionCapture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KioskSessionCapture_sessionId_idx" ON "KioskSessionCapture"("sessionId");

-- CreateIndex
CREATE INDEX "KioskSessionCapture_createdAt_idx" ON "KioskSessionCapture"("createdAt");

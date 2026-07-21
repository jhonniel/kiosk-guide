-- CreateEnum
CREATE TYPE "CharterEditionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "category" TEXT;

-- CreateTable
CREATE TABLE "CharterEdition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL DEFAULT 2026,
    "editionLabel" TEXT NOT NULL DEFAULT '1st Edition',
    "description" TEXT,
    "pdfUrl" TEXT NOT NULL DEFAULT '/downloads/citizens-charter.pdf',
    "pdfFileName" TEXT NOT NULL DEFAULT 'citizens-charter.pdf',
    "status" "CharterEditionStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharterEdition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CharterOffice" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharterOffice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CharterCategory" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharterCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CharterService" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "description" TEXT,
    "officeOrDivision" TEXT,
    "classification" TEXT,
    "typeOfTransaction" TEXT,
    "whoMayAvail" TEXT,
    "detailsJson" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharterService_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CharterRequirement" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "whereToSecure" TEXT NOT NULL DEFAULT '',
    "isSection" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharterRequirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CharterStep" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "step" TEXT NOT NULL DEFAULT '',
    "action" TEXT NOT NULL DEFAULT '',
    "fee" TEXT NOT NULL DEFAULT '',
    "time" TEXT NOT NULL DEFAULT '',
    "person" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharterStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CharterMedicine" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "preparation" TEXT NOT NULL DEFAULT '',
    "brand" TEXT NOT NULL DEFAULT '',
    "price" TEXT NOT NULL DEFAULT '',
    "isSection" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharterMedicine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CharterEdition_status_idx" ON "CharterEdition"("status");
CREATE INDEX "CharterOffice_editionId_sortOrder_idx" ON "CharterOffice"("editionId", "sortOrder");
CREATE INDEX "CharterCategory_officeId_sortOrder_idx" ON "CharterCategory"("officeId", "sortOrder");
CREATE INDEX "CharterService_categoryId_sortOrder_idx" ON "CharterService"("categoryId", "sortOrder");
CREATE INDEX "CharterRequirement_serviceId_sortOrder_idx" ON "CharterRequirement"("serviceId", "sortOrder");
CREATE INDEX "CharterStep_serviceId_sortOrder_idx" ON "CharterStep"("serviceId", "sortOrder");
CREATE INDEX "CharterMedicine_serviceId_sortOrder_idx" ON "CharterMedicine"("serviceId", "sortOrder");

ALTER TABLE "CharterOffice" ADD CONSTRAINT "CharterOffice_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "CharterEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharterCategory" ADD CONSTRAINT "CharterCategory_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "CharterOffice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharterService" ADD CONSTRAINT "CharterService_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CharterCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharterRequirement" ADD CONSTRAINT "CharterRequirement_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "CharterService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharterStep" ADD CONSTRAINT "CharterStep_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "CharterService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharterMedicine" ADD CONSTRAINT "CharterMedicine_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "CharterService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

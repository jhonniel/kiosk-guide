-- AlterTable MapCategory
ALTER TABLE "MapCategory" ADD COLUMN IF NOT EXISTS "showInFilter" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "MapCategory" ADD COLUMN IF NOT EXISTS "showInLegend" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable MapAttraction
ALTER TABLE "MapAttraction" ADD COLUMN IF NOT EXISTS "travelTimeEn" TEXT;
ALTER TABLE "MapAttraction" ADD COLUMN IF NOT EXISTS "travelTimeFil" TEXT;
ALTER TABLE "MapAttraction" ADD COLUMN IF NOT EXISTS "travelTimeBis" TEXT;
ALTER TABLE "MapAttraction" ADD COLUMN IF NOT EXISTS "distanceFromCapitolEn" TEXT;
ALTER TABLE "MapAttraction" ADD COLUMN IF NOT EXISTS "distanceFromCapitolFil" TEXT;
ALTER TABLE "MapAttraction" ADD COLUMN IF NOT EXISTS "distanceFromCapitolBis" TEXT;
ALTER TABLE "MapAttraction" ADD COLUMN IF NOT EXISTS "labelText" TEXT;
ALTER TABLE "MapAttraction" ADD COLUMN IF NOT EXISTS "labelDx" DOUBLE PRECISION;
ALTER TABLE "MapAttraction" ADD COLUMN IF NOT EXISTS "labelDy" DOUBLE PRECISION;
ALTER TABLE "MapAttraction" ADD COLUMN IF NOT EXISTS "labelSide" TEXT;

-- CreateTable MapAnnotation
CREATE TABLE IF NOT EXISTS "MapAnnotation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mapX" DOUBLE PRECISION NOT NULL,
    "mapY" DOUBLE PRECISION NOT NULL,
    "fontSize" DOUBLE PRECISION,
    "anchor" TEXT,
    "infoEn" TEXT,
    "infoFil" TEXT,
    "infoBis" TEXT,
    "skipIfAttractionSlug" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapAnnotation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MapAnnotation_slug_key" ON "MapAnnotation"("slug");
CREATE INDEX IF NOT EXISTS "MapAnnotation_isActive_sortOrder_idx" ON "MapAnnotation"("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "MapAnnotation_kind_idx" ON "MapAnnotation"("kind");

-- AlterTable MapRestaurant
ALTER TABLE "MapRestaurant" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT;
ALTER TABLE "MapRestaurant" ADD COLUMN IF NOT EXISTS "descriptionFil" TEXT;
ALTER TABLE "MapRestaurant" ADD COLUMN IF NOT EXISTS "descriptionBis" TEXT;
ALTER TABLE "MapRestaurant" ADD COLUMN IF NOT EXISTS "coverImage" TEXT;
ALTER TABLE "MapRestaurant" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "MapRestaurant" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "MapRestaurant" ADD COLUMN IF NOT EXISTS "openingHoursEn" TEXT;
ALTER TABLE "MapRestaurant" ADD COLUMN IF NOT EXISTS "openingHoursFil" TEXT;
ALTER TABLE "MapRestaurant" ADD COLUMN IF NOT EXISTS "openingHoursBis" TEXT;
ALTER TABLE "MapRestaurant" ADD COLUMN IF NOT EXISTS "addressEn" TEXT;
ALTER TABLE "MapRestaurant" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable MapHotel
ALTER TABLE "MapHotel" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT;
ALTER TABLE "MapHotel" ADD COLUMN IF NOT EXISTS "descriptionFil" TEXT;
ALTER TABLE "MapHotel" ADD COLUMN IF NOT EXISTS "descriptionBis" TEXT;
ALTER TABLE "MapHotel" ADD COLUMN IF NOT EXISTS "coverImage" TEXT;
ALTER TABLE "MapHotel" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "MapHotel" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "MapHotel" ADD COLUMN IF NOT EXISTS "openingHoursEn" TEXT;
ALTER TABLE "MapHotel" ADD COLUMN IF NOT EXISTS "openingHoursFil" TEXT;
ALTER TABLE "MapHotel" ADD COLUMN IF NOT EXISTS "openingHoursBis" TEXT;
ALTER TABLE "MapHotel" ADD COLUMN IF NOT EXISTS "addressEn" TEXT;
ALTER TABLE "MapHotel" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

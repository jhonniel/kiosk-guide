-- CreateTable
CREATE TABLE "MapMunicipality" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFil" TEXT NOT NULL,
    "nameBis" TEXT,
    "description" TEXT,
    "svgPath" TEXT NOT NULL,
    "labelX" DOUBLE PRECISION NOT NULL,
    "labelY" DOUBLE PRECISION NOT NULL,
    "fillColor" TEXT NOT NULL DEFAULT '#d8efe6',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapMunicipality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFil" TEXT NOT NULL,
    "nameBis" TEXT,
    "color" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapAttraction" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFil" TEXT NOT NULL,
    "nameBis" TEXT,
    "descriptionEn" TEXT NOT NULL,
    "descriptionFil" TEXT NOT NULL,
    "descriptionBis" TEXT,
    "historyEn" TEXT,
    "historyFil" TEXT,
    "historyBis" TEXT,
    "categoryId" TEXT NOT NULL,
    "municipalityId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "mapX" DOUBLE PRECISION NOT NULL,
    "mapY" DOUBLE PRECISION NOT NULL,
    "svgPath" TEXT,
    "coverImage" TEXT,
    "entranceFeeEn" TEXT,
    "entranceFeeFil" TEXT,
    "entranceFeeBis" TEXT,
    "openingHoursEn" TEXT,
    "openingHoursFil" TEXT,
    "openingHoursBis" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "website" TEXT,
    "phone" TEXT,
    "travelTipsEn" TEXT,
    "travelTipsFil" TEXT,
    "travelTipsBis" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapAttraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapPhoto" (
    "id" TEXT NOT NULL,
    "attractionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MapPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapRoute" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFil" TEXT NOT NULL,
    "nameBis" TEXT,
    "kind" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "pointsJson" TEXT NOT NULL,
    "travelTimeEn" TEXT,
    "travelTimeFil" TEXT,
    "travelTimeBis" TEXT,
    "distanceKm" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapFeature" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "nameEn" TEXT,
    "nameFil" TEXT,
    "nameBis" TEXT,
    "svgPath" TEXT NOT NULL,
    "fill" TEXT,
    "stroke" TEXT,
    "zIndex" INTEGER NOT NULL DEFAULT 0,
    "animated" BOOLEAN NOT NULL DEFAULT false,
    "metaJson" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapReview" (
    "id" TEXT NOT NULL,
    "attractionId" TEXT NOT NULL,
    "author" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MapReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapFavorite" (
    "id" TEXT NOT NULL,
    "attractionId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MapFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapRestaurant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFil" TEXT NOT NULL,
    "nameBis" TEXT,
    "description" TEXT,
    "mapX" DOUBLE PRECISION NOT NULL,
    "mapY" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapRestaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapHotel" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFil" TEXT NOT NULL,
    "nameBis" TEXT,
    "description" TEXT,
    "mapX" DOUBLE PRECISION NOT NULL,
    "mapY" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapHotel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MapMunicipality_slug_key" ON "MapMunicipality"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MapCategory_slug_key" ON "MapCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MapAttraction_slug_key" ON "MapAttraction"("slug");

-- CreateIndex
CREATE INDEX "MapAttraction_categoryId_idx" ON "MapAttraction"("categoryId");

-- CreateIndex
CREATE INDEX "MapAttraction_municipalityId_idx" ON "MapAttraction"("municipalityId");

-- CreateIndex
CREATE INDEX "MapAttraction_isActive_sortOrder_idx" ON "MapAttraction"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "MapPhoto_attractionId_sortOrder_idx" ON "MapPhoto"("attractionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "MapRoute_slug_key" ON "MapRoute"("slug");

-- CreateIndex
CREATE INDEX "MapRoute_fromId_idx" ON "MapRoute"("fromId");

-- CreateIndex
CREATE INDEX "MapRoute_toId_idx" ON "MapRoute"("toId");

-- CreateIndex
CREATE UNIQUE INDEX "MapFeature_slug_key" ON "MapFeature"("slug");

-- CreateIndex
CREATE INDEX "MapFeature_kind_zIndex_idx" ON "MapFeature"("kind", "zIndex");

-- CreateIndex
CREATE INDEX "MapReview_attractionId_idx" ON "MapReview"("attractionId");

-- CreateIndex
CREATE INDEX "MapFavorite_sessionId_idx" ON "MapFavorite"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "MapFavorite_attractionId_sessionId_key" ON "MapFavorite"("attractionId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "MapRestaurant_slug_key" ON "MapRestaurant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MapHotel_slug_key" ON "MapHotel"("slug");

-- AddForeignKey
ALTER TABLE "MapAttraction" ADD CONSTRAINT "MapAttraction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MapCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapAttraction" ADD CONSTRAINT "MapAttraction_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "MapMunicipality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapPhoto" ADD CONSTRAINT "MapPhoto_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "MapAttraction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapRoute" ADD CONSTRAINT "MapRoute_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "MapAttraction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapRoute" ADD CONSTRAINT "MapRoute_toId_fkey" FOREIGN KEY ("toId") REFERENCES "MapAttraction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapReview" ADD CONSTRAINT "MapReview_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "MapAttraction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapFavorite" ADD CONSTRAINT "MapFavorite_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "MapAttraction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

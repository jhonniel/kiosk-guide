-- Indoor map tables (GeoJSON text is the app source of truth).
-- Optional: install PostGIS on the server, then run:
--   CREATE EXTENSION IF NOT EXISTS postgis;
--   ALTER TABLE "IndoorRoom" ADD COLUMN IF NOT EXISTS "geom" geometry(Geometry, 0);
--   ALTER TABLE "IndoorAmenity" ADD COLUMN IF NOT EXISTS "geom" geometry(Geometry, 0);
--   CREATE INDEX IF NOT EXISTS "IndoorRoom_geom_idx" ON "IndoorRoom" USING GIST ("geom");
--   CREATE INDEX IF NOT EXISTS "IndoorAmenity_geom_idx" ON "IndoorAmenity" USING GIST ("geom");

-- CreateTable
CREATE TABLE "IndoorBuilding" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFil" TEXT,
    "nameBis" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndoorBuilding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndoorFloor" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "levelIndex" INTEGER NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelFil" TEXT,
    "labelBis" TEXT,
    "widthPx" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "heightPx" DOUBLE PRECISION NOT NULL DEFAULT 700,
    "metersPerPixel" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndoorFloor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndoorFloorAsset" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'reference',
    "mimeType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndoorFloorAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndoorRoom" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "roomNumber" TEXT,
    "nameEn" TEXT NOT NULL,
    "nameFil" TEXT,
    "nameBis" TEXT,
    "department" TEXT,
    "descriptionEn" TEXT,
    "descriptionFil" TEXT,
    "descriptionBis" TEXT,
    "capacity" INTEGER,
    "category" TEXT NOT NULL DEFAULT 'office',
    "accessibility" TEXT NOT NULL DEFAULT 'standard',
    "hoursEn" TEXT,
    "hoursFil" TEXT,
    "hoursBis" TEXT,
    "photoUrl" TEXT,
    "qrPayload" TEXT,
    "geometryJson" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndoorRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndoorAmenity" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT,
    "geometryJson" TEXT NOT NULL,
    "propsJson" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndoorAmenity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndoorNavNode" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "label" TEXT,
    "roomId" TEXT,
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndoorNavNode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndoorNavEdge" (
    "id" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "distanceMeters" DOUBLE PRECISION NOT NULL,
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT true,
    "vertical" BOOLEAN NOT NULL DEFAULT false,
    "verticalToFloorId" TEXT,
    "instruction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndoorNavEdge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IndoorBuilding_slug_key" ON "IndoorBuilding"("slug");
CREATE UNIQUE INDEX "IndoorFloor_buildingId_levelIndex_key" ON "IndoorFloor"("buildingId", "levelIndex");
CREATE INDEX "IndoorFloor_buildingId_sortOrder_idx" ON "IndoorFloor"("buildingId", "sortOrder");
CREATE INDEX "IndoorFloorAsset_floorId_idx" ON "IndoorFloorAsset"("floorId");
CREATE INDEX "IndoorRoom_floorId_idx" ON "IndoorRoom"("floorId");
CREATE INDEX "IndoorRoom_nameEn_idx" ON "IndoorRoom"("nameEn");
CREATE INDEX "IndoorRoom_roomNumber_idx" ON "IndoorRoom"("roomNumber");
CREATE INDEX "IndoorAmenity_floorId_kind_idx" ON "IndoorAmenity"("floorId", "kind");
CREATE INDEX "IndoorNavNode_floorId_idx" ON "IndoorNavNode"("floorId");
CREATE INDEX "IndoorNavNode_roomId_idx" ON "IndoorNavNode"("roomId");
CREATE UNIQUE INDEX "IndoorNavEdge_fromNodeId_toNodeId_key" ON "IndoorNavEdge"("fromNodeId", "toNodeId");
CREATE INDEX "IndoorNavEdge_fromNodeId_idx" ON "IndoorNavEdge"("fromNodeId");
CREATE INDEX "IndoorNavEdge_toNodeId_idx" ON "IndoorNavEdge"("toNodeId");

ALTER TABLE "IndoorFloor" ADD CONSTRAINT "IndoorFloor_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "IndoorBuilding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IndoorFloorAsset" ADD CONSTRAINT "IndoorFloorAsset_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "IndoorFloor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IndoorRoom" ADD CONSTRAINT "IndoorRoom_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "IndoorFloor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IndoorAmenity" ADD CONSTRAINT "IndoorAmenity_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "IndoorFloor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IndoorNavNode" ADD CONSTRAINT "IndoorNavNode_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "IndoorFloor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IndoorNavNode" ADD CONSTRAINT "IndoorNavNode_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "IndoorRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IndoorNavEdge" ADD CONSTRAINT "IndoorNavEdge_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "IndoorNavNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IndoorNavEdge" ADD CONSTRAINT "IndoorNavEdge_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "IndoorNavNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
import { NextResponse } from "next/server";
import { loadPublishedIndoorMap } from "@/features/indoor-map/admin-data";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

  if (q) {
    const rooms = await db.indoorRoom.findMany({
      where: {
        isActive: true,
        floor: { isPublished: true },
        OR: [
          { nameEn: { contains: q, mode: "insensitive" } },
          { nameFil: { contains: q, mode: "insensitive" } },
          { roomNumber: { contains: q, mode: "insensitive" } },
          { department: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        floor: { select: { id: true, labelEn: true, levelIndex: true } },
        navNodes: { take: 1 },
      },
      take: 30,
      orderBy: { nameEn: "asc" },
    });
    return NextResponse.json({
      success: true,
      results: rooms.map((r) => ({
        id: r.id,
        nameEn: r.nameEn,
        roomNumber: r.roomNumber,
        department: r.department,
        category: r.category,
        floorId: r.floorId,
        floorLabel: r.floor.labelEn,
        levelIndex: r.floor.levelIndex,
        nodeId: r.navNodes[0]?.id ?? null,
        geometryJson: r.geometryJson,
      })),
    });
  }

  const payload = await loadPublishedIndoorMap();
  return NextResponse.json({ success: true, ...payload });
}

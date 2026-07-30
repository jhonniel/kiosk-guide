import { NextResponse } from "next/server";
import { computeIndoorRoute } from "@/features/indoor-map/admin-actions";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      fromNodeId?: string;
      toNodeId?: string;
      wheelchairOnly?: boolean;
    };
    if (!body.fromNodeId || !body.toNodeId) {
      return NextResponse.json(
        { success: false, error: "fromNodeId and toNodeId are required." },
        { status: 400 }
      );
    }
    const result = await computeIndoorRoute({
      fromNodeId: body.fromNodeId,
      toNodeId: body.toNodeId,
      wheelchairOnly: body.wheelchairOnly,
    });
    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Routing failed" },
      { status: 500 }
    );
  }
}

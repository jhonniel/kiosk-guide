import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { languageSchema } from "@/lib/validations";
import { resolveBuildingGuide } from "@/features/building-directory/guide-service";

const guideSchema = z.object({
  q: z.string().min(1),
  lang: languageSchema.default("en"),
  locationId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = guideSchema.safeParse({
      q: searchParams.get("q") ?? "",
      lang: searchParams.get("lang") ?? "en",
      locationId: searchParams.get("locationId") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const response = await resolveBuildingGuide(
      parsed.data.q,
      parsed.data.lang,
      parsed.data.locationId
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("[building-directory/guide]", error);
    return NextResponse.json(
      { error: "Failed to process building guide request." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = guideSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const response = await resolveBuildingGuide(
      parsed.data.q,
      parsed.data.lang,
      parsed.data.locationId
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("[building-directory/guide]", error);
    return NextResponse.json(
      { error: "Failed to process building guide request." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { languageSchema } from "@/lib/validations";
import { navigateBuilding } from "@/features/building-directory/navigation/navigation-service";

const navigateSchema = z.object({
  toLocationId: z.string().min(1),
  fromLocationId: z.string().optional(),
  accessible: z.boolean().optional(),
  lang: languageSchema.default("en"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = navigateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    const response = await navigateBuilding(parsed.data);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[building-directory/navigate]", error);
    return NextResponse.json(
      { success: false, error: "Navigation service unavailable. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = navigateSchema.safeParse({
      toLocationId: searchParams.get("toLocationId"),
      fromLocationId: searchParams.get("fromLocationId") ?? undefined,
      accessible: searchParams.get("accessible") === "true",
      lang: searchParams.get("lang") ?? "en",
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    const response = await navigateBuilding(parsed.data);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[building-directory/navigate]", error);
    return NextResponse.json(
      { success: false, error: "Navigation service unavailable. Please try again." },
      { status: 500 }
    );
  }
}

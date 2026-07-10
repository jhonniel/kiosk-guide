import { NextRequest, NextResponse } from "next/server";
import { searchSchema } from "@/lib/validations";
import { searchAll, logSearch } from "@/features/search/search-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = searchSchema.safeParse({
    q: searchParams.get("q") ?? "",
    lang: searchParams.get("lang") ?? "en",
  });

  if (!parsed.success) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchAll(parsed.data.q, parsed.data.lang);
  await logSearch(parsed.data.q, results.length);

  return NextResponse.json({ results });
}

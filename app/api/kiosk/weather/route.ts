import { NextResponse } from "next/server";
import { getCamiguinWeather } from "@/features/weather/weather-service";

export const dynamic = "force-dynamic";

/** Current Camiguin weather for the kiosk top bar. */
export async function GET() {
  try {
    const weather = await getCamiguinWeather();
    return NextResponse.json(weather, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[kiosk/weather]", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Weather is unavailable right now." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

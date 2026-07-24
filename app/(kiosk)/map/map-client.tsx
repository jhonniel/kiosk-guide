"use client";

import dynamic from "next/dynamic";
import type { MapEnginePayload } from "@/services/map/load-map-engine-data";

const CamiguinTourismMap = dynamic(
  () =>
    import("@/components/kiosk/map/CamiguinTourismMap").then(
      (m) => m.CamiguinTourismMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl bg-[#5eb8d9] text-sm font-medium text-kiosk-navy">
        Loading Camiguin map…
      </div>
    ),
  }
);

type Props = {
  data: MapEnginePayload;
};

export function MapClient({ data }: Props) {
  return <CamiguinTourismMap data={data} />;
}

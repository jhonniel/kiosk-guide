"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { MapEnginePayload } from "@/services/map/load-map-engine-data";
import { warmupMapEngine } from "@/lib/map-preload";
import { useKiosk } from "@/hooks/use-kiosk";
import { MapWarmupOverlay } from "@/components/kiosk/map/MapWarmupOverlay";

const CamiguinTourismMap = dynamic(
  () =>
    import("@/components/kiosk/map/CamiguinTourismMap").then(
      (m) => m.CamiguinTourismMap
    ),
  {
    ssr: false,
    loading: () => null,
  }
);

type Props = {
  data: MapEnginePayload;
};

export function MapClient({ data }: Props) {
  const { language } = useKiosk();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void warmupMapEngine().then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {ready ? (
        <CamiguinTourismMap data={data} />
      ) : (
        <div className="flex min-h-0 flex-1 rounded-2xl bg-[#5eb0cc]" aria-busy="true" />
      )}
      {!ready ? <MapWarmupOverlay language={language} /> : null}
    </div>
  );
}

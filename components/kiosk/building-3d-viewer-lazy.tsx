"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Building3DErrorBoundary } from "@/components/kiosk/building-3d-error-boundary";
import { BuildingMapLoader } from "@/components/kiosk/building-map-loader";
import { useKiosk } from "@/hooks/use-kiosk";
import { pickLang } from "@/lib/i18n/translations";
import type { ComponentProps } from "react";
import type { Building3DViewer } from "@/components/kiosk/building-3d-viewer";

function ViewerLoading() {
  const { language } = useKiosk();
  return (
    <BuildingMapLoader
      className="h-full min-h-[320px] rounded-2xl"
      label={pickLang(
        language,
        "Loading the building map",
        "Inihahanda ang mapa ng gusali",
        "Giandam ang mapa sa building"
      )}
    />
  );
}

const DynamicBuilding3DViewer = dynamic(
  () => import("./building-3d-viewer").then((m) => m.Building3DViewer),
  {
    ssr: false,
    loading: () => <ViewerLoading />,
  }
);

type Building3DViewerProps = ComponentProps<typeof Building3DViewer>;

export function Building3DViewerLazy(props: Building3DViewerProps) {
  const { language } = useKiosk();
  const [retryKey, setRetryKey] = useState(0);

  return (
    <Building3DErrorBoundary language={language} onRetry={() => setRetryKey((k) => k + 1)}>
      <DynamicBuilding3DViewer key={retryKey} {...props} />
    </Building3DErrorBoundary>
  );
}

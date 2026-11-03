"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Building3DErrorBoundary } from "@/components/kiosk/building-3d-error-boundary";
import { BuildingMapLoader } from "@/components/kiosk/building-map-loader";
import type { ComponentProps } from "react";
import type { Building3DViewer } from "@/components/kiosk/building-3d-viewer";

const DynamicBuilding3DViewer = dynamic(
  () => import("./building-3d-viewer").then((m) => m.Building3DViewer),
  {
    ssr: false,
    loading: () => <BuildingMapLoader className="h-full min-h-[320px] rounded-2xl" />,
  }
);

type Building3DViewerProps = ComponentProps<typeof Building3DViewer>;

export function Building3DViewerLazy(props: Building3DViewerProps) {
  const [retryKey, setRetryKey] = useState(0);

  return (
    <Building3DErrorBoundary onRetry={() => setRetryKey((k) => k + 1)}>
      <DynamicBuilding3DViewer key={retryKey} {...props} />
    </Building3DErrorBoundary>
  );
}

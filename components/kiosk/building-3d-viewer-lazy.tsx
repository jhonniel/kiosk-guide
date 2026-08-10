"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Building3DErrorBoundary } from "@/components/kiosk/building-3d-error-boundary";
import type { ComponentProps } from "react";
import type { Building3DViewer } from "@/components/kiosk/building-3d-viewer";

const DynamicBuilding3DViewer = dynamic(
  () => import("./building-3d-viewer").then((m) => m.Building3DViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[320px] animate-pulse items-center justify-center rounded-2xl border border-gray-200 bg-gradient-to-b from-[#e8f0fa] to-[#f4f7fb] text-sm text-gray-500">
        Loading 3D building…
      </div>
    ),
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

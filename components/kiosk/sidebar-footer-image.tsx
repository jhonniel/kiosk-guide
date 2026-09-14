"use client";

import Image from "next/image";
import { resolveKioskAssetUrl } from "@/lib/kiosk-sync-url";

export function SidebarFooterImage({ src, alt }: { src: string; alt: string }) {
  const imageSrc = resolveKioskAssetUrl(src);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      className="object-cover object-[center_35%]"
      unoptimized
      loading="eager"
    />
  );
}

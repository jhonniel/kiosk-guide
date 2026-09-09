"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { resolveKioskAssetUrl } from "@/lib/kiosk-sync-url";
import { scheduleWhenIdle } from "@/lib/kiosk-performance";

export function SidebarFooterImage({ src, alt }: { src: string; alt: string }) {
  const imageSrc = resolveKioskAssetUrl(src);
  const [loadImage, setLoadImage] = useState(false);

  useEffect(() => scheduleWhenIdle(() => setLoadImage(true), 3000), []);

  return (
    <>
      {loadImage ? (
        <Image
          src={imageSrc}
          alt={alt}
          fill
          className="object-cover object-[center_35%]"
          unoptimized
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-[#0f1c31]" aria-hidden />
      )}
    </>
  );
}

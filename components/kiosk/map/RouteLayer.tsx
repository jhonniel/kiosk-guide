"use client";

import { memo, useEffect, useRef } from "react";
import gsap from "gsap";
import type { MapRoute } from "@/features/map/types";
import { cn } from "@/lib/utils";

type Props = {
  route: MapRoute | null;
};

export const RouteLayer = memo(function RouteLayer({ route }: Props) {
  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const el = pathRef.current;
    if (!el || !route) return;
    const length = el.getTotalLength();
    gsap.killTweensOf(el);
    gsap.set(el, { strokeDasharray: length, strokeDashoffset: length });
    gsap.to(el, {
      strokeDashoffset: 0,
      duration: 1.4,
      ease: "power2.out",
    });
    const pulse = gsap.to(el, {
      strokeOpacity: 0.55,
      duration: 0.9,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: 1.4,
    });
    return () => {
      pulse.kill();
      gsap.killTweensOf(el);
    };
  }, [route]);

  if (!route?.points.length) return null;

  const d = route.points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const isBoat = route.kind === "boat";

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke={isBoat ? "rgba(14,165,233,0.35)" : "rgba(234,179,8,0.35)"}
        strokeWidth={1.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        ref={pathRef}
        d={d}
        fill="none"
        className={cn(isBoat ? "drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]" : "drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]")}
        stroke={isBoat ? "#38bdf8" : "#facc15"}
        strokeWidth={0.85}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

"use client";

import Link from "next/link";
import Image from "next/image";
import { getIcon } from "@/utils/icon-map";
import { KIOSK_COLORS, type CardColor } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { normalizeVisitPage } from "@/features/kiosk/quick-start";
import { isQuickStartEligiblePage } from "@/features/kiosk/quick-start-catalog";
import { useQuickStartVisits } from "@/components/kiosk/quick-start-visit-provider";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: string;
  iconUrl?: string | null;
  color: string;
  href: string;
  className?: string;
}

export function ServiceCard({ title, description, icon, iconUrl, color, href, className }: ServiceCardProps) {
  const Icon = getIcon(icon);
  const colorKey = (color in KIOSK_COLORS.card ? color : "blue") as CardColor;
  const palette = KIOSK_COLORS.card[colorKey];
  const { recordVisit } = useQuickStartVisits();

  const onOpen = () => {
    const page = normalizeVisitPage(href);
    if (isQuickStartEligiblePage(page)) {
      recordVisit(page);
    }
  };

  return (
    <Link
      href={href}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        onOpen();
      }}
      className={cn(
        "group flex h-full min-h-0 min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-3xl bg-white px-2 py-1.5 text-center shadow-md",
        "transition-shadow duration-200 hover:shadow-xl active:brightness-95",
        className
      )}
    >
      {iconUrl ? (
        <div
          className="aspect-square w-[clamp(3.25rem,52%,6.25rem)] shrink-0 overflow-hidden rounded-full transition-transform duration-200 group-hover:scale-105"
          style={{ boxShadow: `0 8px 20px -6px ${palette.icon}66` }}
        >
          <Image
            src={iconUrl}
            alt=""
            width={160}
            height={160}
            className="h-full w-full scale-[1.22] object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div
          className="flex aspect-square w-[clamp(3.25rem,52%,6.25rem)] shrink-0 items-center justify-center rounded-full shadow-lg transition-transform duration-200 group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${palette.icon} 0%, ${palette.text} 100%)`,
            boxShadow: `0 8px 20px -6px ${palette.icon}66`,
          }}
        >
          <Icon className="h-[55%] w-[55%] text-white" strokeWidth={1.75} />
        </div>
      )}

      <h3
        className="min-w-0 max-w-full shrink-0 truncate px-0.5 text-[clamp(0.65rem,4.5cqw,0.95rem)] leading-tight font-extrabold tracking-wide uppercase"
        style={{ color: palette.text }}
      >
        {title}
      </h3>
      <p className="line-clamp-2 min-w-0 max-w-full px-0.5 text-[clamp(0.6rem,3.8cqw,0.85rem)] leading-snug text-gray-600">
        {description}
      </p>
    </Link>
  );
}

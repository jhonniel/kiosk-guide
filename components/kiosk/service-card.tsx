import Link from "next/link";
import Image from "next/image";
import { getIcon } from "@/utils/icon-map";
import { KIOSK_COLORS, type CardColor } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: string;
  iconUrl?: string | null;
  color: string;
  href: string;
}

export function ServiceCard({ title, description, icon, iconUrl, color, href }: ServiceCardProps) {
  const Icon = getIcon(icon);
  const colorKey = (color in KIOSK_COLORS.card ? color : "blue") as CardColor;
  const palette = KIOSK_COLORS.card[colorKey];

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col items-center rounded-2xl bg-white p-5 text-center shadow-md",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]"
      )}
    >
      <div
        className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: palette.bg }}
      >
        {iconUrl ? (
          <Image
            src={iconUrl}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            unoptimized
          />
        ) : (
          <Icon className="h-8 w-8" style={{ color: palette.icon }} />
        )}
      </div>
      <h3 className="mb-1 text-sm font-bold leading-tight" style={{ color: palette.text }}>
        {title}
      </h3>
      <p className="text-xs leading-relaxed text-gray-500">{description}</p>
    </Link>
  );
}

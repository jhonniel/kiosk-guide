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
  className?: string;
}

export function ServiceCard({ title, description, icon, iconUrl, color, href, className }: ServiceCardProps) {
  const Icon = getIcon(icon);
  const colorKey = (color in KIOSK_COLORS.card ? color : "blue") as CardColor;
  const palette = KIOSK_COLORS.card[colorKey];

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col items-center overflow-hidden rounded-3xl bg-white px-5 py-5 text-center shadow-md",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]",
        className
      )}
    >
      {iconUrl ? (
        <div
          className="mb-4 h-[min(6rem,11vh)] w-[min(6rem,11vh)] shrink-0 overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-110"
          style={{ boxShadow: `0 8px 20px -6px ${palette.icon}66` }}
        >
          <Image
            src={iconUrl}
            alt=""
            width={96}
            height={96}
            className="h-full w-full scale-[1.22] object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div
          className="mb-4 flex h-[min(6rem,11vh)] w-[min(6rem,11vh)] shrink-0 items-center justify-center rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${palette.icon} 0%, ${palette.text} 100%)`,
            boxShadow: `0 8px 20px -6px ${palette.icon}66`,
          }}
        >
          <Icon className="h-[55%] w-[55%] text-white" strokeWidth={1.75} />
        </div>
      )}
      <h3
        className="mb-2 text-[15px] leading-tight font-extrabold tracking-wide uppercase"
        style={{ color: palette.text }}
      >
        {title}
      </h3>
      <p className="line-clamp-2 text-[13px] leading-relaxed text-gray-600">{description}</p>
    </Link>
  );
}

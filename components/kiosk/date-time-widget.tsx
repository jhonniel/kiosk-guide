"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/** Fixed top bar height — keeps back/title row aligned with the date/time widgets. */
export const kioskTopBarHeightClass = "h-[4.75rem] min-h-[4.75rem]";

/** Width of the shell-level date/time cluster (must match kioskDateTimeReserveClass). */
export const kioskDateTimeWidthClass = "w-[27.5rem]";

/** Right padding so page headers don't sit under the shell-level date/time widget. */
export const kioskDateTimeReserveClass = "pr-[27.5rem]";

export function DateTimeWidget() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  if (!now) {
    return (
      <div className={cn("flex w-full items-center justify-end gap-3", kioskDateTimeWidthClass)}>
        <div className="h-[4.25rem] w-44 animate-pulse rounded-2xl bg-white/50" />
        <div className="h-[4.25rem] w-36 animate-pulse rounded-2xl bg-white/50" />
      </div>
    );
  }

  return (
    <div className={cn("flex w-full items-center justify-end gap-3", kioskDateTimeWidthClass)}>
      <div className="flex h-[4.25rem] items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-[0_8px_24px_-16px_rgba(15,35,70,0.28)]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kiosk-navy/10">
          <Calendar className="h-5 w-5 text-kiosk-navy" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-kiosk-navy">
            {format(now, "MMMM d, yyyy")}
          </p>
          <p className="text-xs text-gray-500">{format(now, "EEEE")}</p>
        </div>
      </div>
      <div className="flex h-[4.25rem] items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-[0_8px_24px_-16px_rgba(15,35,70,0.28)]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kiosk-navy/10">
          <Clock className="h-5 w-5 text-kiosk-navy" />
        </div>
        <div>
          <p className="text-lg font-bold tabular-nums text-kiosk-navy">
            {format(now, "h:mm:ss a")}
          </p>
        </div>
      </div>
    </div>
  );
}

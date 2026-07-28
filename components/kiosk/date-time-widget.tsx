"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";

/** Right padding so page headers don't sit under the shell-level date/time widget. */
export const kioskDateTimeReserveClass = "md:pr-[21rem]";

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
      <div className="flex gap-2 sm:gap-3">
        <div className="h-12 w-36 animate-pulse rounded-2xl bg-white/50 sm:h-16 sm:w-44" />
        <div className="h-12 w-28 animate-pulse rounded-2xl bg-white/50 sm:h-16 sm:w-36" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="flex h-12 items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-[0_8px_24px_-16px_rgba(15,35,70,0.28)] sm:h-[4.25rem] sm:gap-3 sm:px-5 sm:py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kiosk-navy/10 sm:h-10 sm:w-10">
          <Calendar className="h-4 w-4 text-kiosk-navy sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-kiosk-navy sm:text-sm">
            {format(now, "MMMM d, yyyy")}
          </p>
          <p className="text-[10px] text-gray-500 sm:text-xs">{format(now, "EEEE")}</p>
        </div>
      </div>
      <div className="flex h-12 items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-[0_8px_24px_-16px_rgba(15,35,70,0.28)] sm:h-[4.25rem] sm:gap-3 sm:px-5 sm:py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kiosk-navy/10 sm:h-10 sm:w-10">
          <Clock className="h-4 w-4 text-kiosk-navy sm:h-5 sm:w-5" />
        </div>
        <div>
          <p className="text-base font-bold tabular-nums text-kiosk-navy sm:text-lg">
            {format(now, "h:mm:ss a")}
          </p>
        </div>
      </div>
    </div>
  );
}

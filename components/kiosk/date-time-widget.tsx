"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function DateTimeWidget({
  subtle = false,
}: {
  /** Softer, slimmer cards for dense layouts like Citizens' Charter overview. */
  subtle?: boolean;
}) {
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
      <div className="flex gap-2.5">
        <div className={cn("animate-pulse rounded-2xl bg-white/60", subtle ? "h-14 w-40" : "h-16 w-44")} />
        <div className={cn("animate-pulse rounded-2xl bg-white/60", subtle ? "h-14 w-32" : "h-16 w-36")} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", subtle ? "gap-2.5" : "gap-3")}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl bg-white",
          subtle
            ? "h-[3.5rem] px-4 py-2 shadow-[0_6px_18px_-10px_rgba(15,35,70,0.28)] ring-1 ring-slate-200/60"
            : "h-[4.25rem] px-5 py-3 shadow-md"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-kiosk-navy/10",
            subtle ? "h-8 w-8" : "h-10 w-10"
          )}
        >
          <Calendar className={cn(subtle ? "h-4 w-4" : "h-5 w-5", "text-kiosk-navy")} />
        </div>
        <div>
          <p className={cn("font-semibold text-kiosk-navy", subtle ? "text-[13px]" : "text-sm")}>
            {format(now, "MMMM d, yyyy")}
          </p>
          <p className={cn("text-gray-500", subtle ? "text-[11px]" : "text-xs")}>
            {format(now, "EEEE")}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl bg-white",
          subtle
            ? "h-[3.5rem] px-4 py-2 shadow-[0_6px_18px_-10px_rgba(15,35,70,0.28)] ring-1 ring-slate-200/60"
            : "h-[4.25rem] px-5 py-3 shadow-md"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-kiosk-navy/10",
            subtle ? "h-8 w-8" : "h-10 w-10"
          )}
        >
          <Clock className={cn(subtle ? "h-4 w-4" : "h-5 w-5", "text-kiosk-navy")} />
        </div>
        <div>
          <p
            className={cn(
              "font-bold tabular-nums text-kiosk-navy",
              subtle ? "text-base" : "text-lg"
            )}
          >
            {format(now, "h:mm:ss a")}
          </p>
        </div>
      </div>
    </div>
  );
}

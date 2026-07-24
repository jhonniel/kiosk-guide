"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";

function startOfMinute(date: Date) {
  const next = new Date(date);
  next.setSeconds(0, 0);
  return next;
}

export function DateTimeWidget() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(startOfMinute(new Date()));

    const tick = () => {
      const minute = startOfMinute(new Date());
      setNow((prev) => {
        if (prev && prev.getTime() === minute.getTime()) return prev;
        return minute;
      });
    };

    // Align to the next minute boundary so we don't re-render the header every second.
    const msToNextMinute = 60_000 - (Date.now() % 60_000) + 50;
    let intervalId = 0;
    const timeoutId = window.setTimeout(() => {
      tick();
      intervalId = window.setInterval(tick, 60_000);
    }, msToNextMinute);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  if (!now) {
    return (
      <div className="flex gap-3">
        <div className="h-16 w-44 animate-pulse rounded-2xl bg-white/60" />
        <div className="h-16 w-36 animate-pulse rounded-2xl bg-white/60" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-[4.25rem] items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-md">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kiosk-navy/10">
          <Calendar className="h-5 w-5 text-kiosk-navy" />
        </div>
        <div>
          <p className="text-sm font-semibold text-kiosk-navy">{format(now, "MMMM d, yyyy")}</p>
          <p className="text-xs text-gray-500">{format(now, "EEEE")}</p>
        </div>
      </div>
      <div className="flex h-[4.25rem] items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-md">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kiosk-navy/10">
          <Clock className="h-5 w-5 text-kiosk-navy" />
        </div>
        <div>
          <p className="text-lg font-bold text-kiosk-navy">{format(now, "h:mm a")}</p>
        </div>
      </div>
    </div>
  );
}

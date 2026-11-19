import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Standard padded container for every admin screen, so pages line up with the sidebar the same way. */
export function AdminPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8", className)}>{children}</div>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
  as: Heading = "h1",
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <Heading
          className={cn("font-bold text-kiosk-navy", Heading === "h1" ? "text-2xl" : "text-lg")}
        >
          {title}
        </Heading>
        {description ? <p className="mt-1 max-w-3xl text-sm text-gray-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Message shown in place of a page that cannot load its data. */
export function AdminNotice({
  tone = "neutral",
  title,
  children,
}: {
  tone?: "neutral" | "warning" | "error";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    neutral: "border-dashed border-gray-300 bg-white text-gray-600",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    error: "border-red-200 bg-red-50 text-red-800",
  };
  return (
    <div className={cn("rounded-xl border p-8 text-center text-sm", tones[tone])}>
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      {children}
    </div>
  );
}

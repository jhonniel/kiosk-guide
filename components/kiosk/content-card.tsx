import { cn } from "@/lib/utils";

interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
}

export function ContentCard({ children, className }: ContentCardProps) {
  return (
    <div className={cn("kiosk-hover-lift rounded-2xl bg-white p-4 shadow-md sm:p-5 lg:p-6", className)}>
      {children}
    </div>
  );
}

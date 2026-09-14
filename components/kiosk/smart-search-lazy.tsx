"use client";

import dynamic from "next/dynamic";
import { Search } from "lucide-react";

function SmartSearchSkeleton() {
  return (
    <div
      className="flex h-14 w-full items-center gap-3 rounded-2xl border border-gray-200/80 bg-white/90 px-4 shadow-sm"
      aria-hidden
    >
      <Search className="h-5 w-5 shrink-0 text-gray-400" />
      <div className="h-4 flex-1 rounded bg-gray-100" />
    </div>
  );
}

export const SmartSearchLazy = dynamic(
  () => import("./smart-search").then((mod) => ({ default: mod.SmartSearch })),
  { loading: () => <SmartSearchSkeleton />, ssr: false }
);

"use client";

import dynamic from "next/dynamic";
import type { Language } from "@/lib/i18n/translations";

const KioskIdleAttract = dynamic(
  () => import("./kiosk-idle-attract").then((m) => m.KioskIdleAttract),
  { ssr: false }
);

type Props = {
  language: Language;
  enabled: boolean;
  videoUrl: string;
  idleSeconds: number;
  countdownSeconds: number;
};

/** Defer idle-attract JS until after first paint so home stays responsive. */
export function KioskIdleAttractLazy(props: Props) {
  return <KioskIdleAttract {...props} />;
}

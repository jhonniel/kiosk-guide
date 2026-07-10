import { KioskLayoutClient } from "./kiosk-layout-client";

export const dynamic = "force-static";

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return <KioskLayoutClient>{children}</KioskLayoutClient>;
}

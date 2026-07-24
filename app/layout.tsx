import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { OfflineProvider } from "@/components/providers/offline-provider";
import { ServiceWorkerRegister } from "@/components/kiosk/service-worker-register";
import { KioskZoomGuard } from "@/components/kiosk/kiosk-zoom-guard";
import { KioskSwipeBackGuard } from "@/components/kiosk/kiosk-swipe-back-guard";
import { KioskProvider } from "@/hooks/use-kiosk";
import { fontSans, fontScript } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "LGU Information & Visitor Experience Kiosk | Camiguin",
  description: "Your guide to government services and everything Camiguin.",
  applicationName: "LGU Kiosk Guide",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kiosk Guide",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f7f9fc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontSans.variable} ${fontScript.variable} font-sans antialiased`}>
        <KioskProvider>
          <OfflineProvider>
            <KioskZoomGuard />
            <KioskSwipeBackGuard />
            {children}
            <ServiceWorkerRegister />
            <Toaster />
          </OfflineProvider>
        </KioskProvider>
      </body>
    </html>
  );
}

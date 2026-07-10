import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { OfflineProvider } from "@/components/providers/offline-provider";
import { ServiceWorkerRegister } from "@/components/kiosk/service-worker-register";
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
  themeColor: "#1e3a5f",
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
            {children}
            <ServiceWorkerRegister />
            <Toaster />
          </OfflineProvider>
        </KioskProvider>
      </body>
    </html>
  );
}

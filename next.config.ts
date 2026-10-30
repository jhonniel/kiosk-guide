import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { readKioskPrecacheEntries } from "./lib/offline/precache-routes";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: readKioskPrecacheEntries(),
});

const nextConfig: NextConfig = {
  output: "standalone",
  // Dev assets must load when the kiosk is opened from another device on the LAN.
  allowedDevOrigins: ["10.0.254.56", "10.*.*.*", "192.168.*.*", "172.*.*.*"],
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "date-fns"],
  },
};

export default withSerwist(nextConfig);

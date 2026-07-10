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
  images: {
    unoptimized: true,
  },
};

export default withSerwist(nextConfig);

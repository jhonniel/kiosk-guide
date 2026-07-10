import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LGU Kiosk Guide — Camiguin",
    short_name: "Kiosk Guide",
    description: "Government services and visitor information kiosk for Camiguin.",
    start_url: "/",
    display: "standalone",
    background_color: "#f0f4f8",
    theme_color: "#1e3a5f",
    orientation: "landscape",
    icons: [
      {
        src: "/images/branding/logo.png",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/images/branding/logo.png",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}

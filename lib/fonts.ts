import { Inter, Great_Vibes } from "next/font/google";

export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const fontScript = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-tagline",
  weight: "400",
  display: "swap",
});

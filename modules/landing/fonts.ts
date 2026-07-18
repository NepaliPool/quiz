import { IBM_Plex_Sans, Instrument_Serif } from "next/font/google";

export const landingSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-landing-sans",
  display: "swap",
});

export const landingDisplay = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-landing-display",
  display: "swap",
});

import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/seo";

export const runtime = "edge";
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#f6f8fa",
          color: "#1a2330",
          padding: "64px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              backgroundColor: "#00DC33",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            Q
          </div>
          <div style={{ fontSize: 42, fontWeight: 600, letterSpacing: "-0.04em" }}>
            {siteConfig.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 600,
              letterSpacing: "-0.05em",
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            {siteConfig.tagline}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#5b6575",
              maxWidth: 860,
              lineHeight: 1.35,
            }}
          >
            Choose a faculty, unlock quiz sets with one-time codes, and get
            subject-wise marks.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #c9d1db",
            paddingTop: 28,
            fontSize: 22,
            color: "#5b6575",
          }}
        >
          <span>One code · All subjects · Clear marks</span>
          <span style={{ color: "#1f7a3a", fontWeight: 600 }}>quizdesk</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

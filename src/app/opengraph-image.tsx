import { ImageResponse } from "next/og";
import { SITE } from "@/content/site";

export const runtime = "edge";
export const alt = `${SITE.name} | ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: "#000000",
          backgroundImage: "radial-gradient(circle at 0% 0%, rgba(127,227,210,0.16), transparent 55%), radial-gradient(circle at 100% 100%, rgba(229,163,74,0.12), transparent 55%)",
          color: "#F2F3F1",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* The wordmark, in the image's built-in sans: "gymspilot" and a boxed PRO. */}
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -0.5, color: "#F2F3F1" }}>gymspilot</div>
          <div style={{ display: "flex", fontSize: 16, fontWeight: 700, letterSpacing: 2, color: "#A9AEAC", border: "1px solid rgba(255,255,255,0.14)", padding: "4px 9px" }}>PRO</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2.5, maxWidth: 1000 }}>{SITE.tagline}</div>
          <div style={{ fontSize: 28, color: "#A9AEAC", maxWidth: 960, lineHeight: 1.4 }}>{SITE.description}</div>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 22, color: "#A9AEAC" }}>
          {SITE.heroPills.map((p) => (
            <div key={p} style={{ padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.03)" }}>
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}

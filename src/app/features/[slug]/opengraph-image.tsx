import { ImageResponse } from "next/og";
import { FEATURES, featureBySlug, groupOf } from "@/content/features";
import { SITE } from "@/content/site";

// The picture a link to a feature page shows when it is shared: the same
// look as the site's own card, with the feature's headline on it.
export const alt = `A feature of ${SITE.name}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return FEATURES.map((f) => ({ slug: f.slug }));
}

export default async function FeatureOpenGraphImage({ params }: { params: { slug: string } | Promise<{ slug: string }> }) {
  const { slug } = await params;
  const feature = featureBySlug(slug);
  const group = feature ? groupOf(feature) : null;

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
          {group && <div style={{ marginLeft: 12, fontSize: 24, color: "#7C817F" }}>{`Features · ${group.label}`}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#7FE3D2", letterSpacing: 0.5 }}>{feature ? feature.name : "Features"}</div>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2.5, maxWidth: 1050 }}>{feature ? feature.title : SITE.tagline}</div>
          <div style={{ fontSize: 30, color: "#A9AEAC", maxWidth: 1000, lineHeight: 1.4 }}>{feature ? feature.text : SITE.description}</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 22, color: "#A9AEAC" }}>
          {(feature ? feature.points.slice(0, 3) : SITE.heroPills).map((p) => (
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

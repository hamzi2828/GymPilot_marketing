import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// Content-Security-Policy
//
// The panel's platform token lives in localStorage (the API is on its own
// domain, so an HttpOnly cookie would be a third-party one, which browsers
// block). Any script that runs on this origin can read it; this policy
// narrows what can run and where anything it reads could be sent.
//
//   script-src  'self' plus 'unsafe-inline'. Next.js writes inline scripts
//               into every page, and the analytics snippets are inline. A
//               per-request nonce (the only alternative) would make every
//               marketing page dynamic. No other host may serve script except
//               Google Analytics / the Meta Pixel, and only when their ids
//               are set. 'unsafe-eval' only under `next dev`.
//   connect-src 'self', the API, and the analytics beacons when enabled --
//               the exfiltration channel an injected script would use.
//   object-src 'none', base-uri 'self', form-action 'self', and nobody may
//               frame any of it.
// Preview deployments also get Vercel's toolbar (vercel.live).
//
// The panel also shows pictures the API stored -- receipts gyms send and the
// bank QR codes -- from the Blob store, or from the API's /uploads under
// `next dev`; only PANEL_PATHS may load images from there.
//
// The panel and its sign-in pages (PANEL_PATHS) get the same policy without
// the analytics hosts: the console that runs every gym, and the reset page
// with its token in the address, never run a tracker's script or send it
// anything, even if one was loaded on a marketing page first. Links into
// them from the site are plain <a>s, so arriving is a fresh page that this
// policy covers, not a move inside the marketing page still running them.
// ---------------------------------------------------------------------------
function originOf(value: string | undefined): string {
  try {
    return new URL(value || "").origin;
  } catch {
    return "";
  }
}

const IS_DEV = process.env.NODE_ENV !== "production";
const IS_PREVIEW = process.env.VERCEL_ENV === "preview";
// lib/api.ts falls back to localhost:4000 when the variable is unset under
// `next dev` (a production build without it stops there).
const API_ORIGIN = originOf(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000");
const GA = (process.env.NEXT_PUBLIC_GA_ID || "").trim() !== "";
const META = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "").trim() !== "";

// Where the analytics policy does not reach (see above). Kept in step with
// PANEL in components/marketing/Analytics.tsx.
const PANEL_PATHS = ["/login", "/forgot", "/reset", "/super-admin", "/super-admin/:path*"];

// Where stored files are served from (see helper/blobUpload.js on the API).
const UPLOAD_HOSTS = [API_ORIGIN, "https://*.public.blob.vercel-storage.com"].filter(Boolean);

function contentSecurityPolicy({ analytics, uploads = false }: { analytics: boolean; uploads?: boolean }): string {
  const ga = analytics && GA;
  const meta = analytics && META;
  const vercelLive = IS_PREVIEW ? ["https://vercel.live"] : [];
  const gaHosts = ga ? ["https://*.googletagmanager.com", "https://*.google-analytics.com", "https://*.analytics.google.com"] : [];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(IS_DEV ? ["'unsafe-eval'"] : []), ...(ga ? ["https://*.googletagmanager.com"] : []), ...(meta ? ["https://connect.facebook.net"] : []), ...vercelLive],
    "style-src": ["'self'", "'unsafe-inline'", ...vercelLive],
    "font-src": ["'self'", "data:", ...(IS_PREVIEW ? ["https://vercel.live", "https://assets.vercel.com"] : [])],
    "img-src": ["'self'", "data:", "blob:", ...(uploads ? UPLOAD_HOSTS : []), ...gaHosts, ...(meta ? ["https://www.facebook.com"] : []), ...(IS_PREVIEW ? ["https://vercel.live", "https://vercel.com"] : [])],
    "connect-src": ["'self'", API_ORIGIN, ...gaHosts, ...(meta ? ["https://www.facebook.com", "https://connect.facebook.net"] : []), ...(IS_PREVIEW ? ["https://vercel.live", "wss://ws-us3.pusher.com"] : [])].filter(Boolean),
    "frame-src": ["'self'", ...(ga ? ["https://*.googletagmanager.com"] : []), ...vercelLive],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // The panel decides who runs every gym on the platform, so no other site
  // may put it in a frame: a click on what looks like their own page would
  // otherwise land on a button in here. `frame-ancestors` is what modern
  // browsers honour; X-Frame-Options covers the older ones.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy({ analytics: true }) },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      // After the rule above, so its policy is the one these pages get (the
      // later of two matching rules sets the header).
      ...PANEL_PATHS.map((source) => ({
        source,
        headers: [{ key: "Content-Security-Policy", value: contentSecurityPolicy({ analytics: false, uploads: true }) }],
      })),
      // The desk app installer the gym admin panel links to: always saved as
      // a file, never opened in the tab.
      {
        source: "/downloads/:path*",
        headers: [
          { key: "Content-Type", value: "application/octet-stream" },
          { key: "Content-Disposition", value: "attachment" },
        ],
      },
    ];
  },
  // The sign-in pages used to live under /super-admin; old links and
  // password-reset emails still work.
  async redirects() {
    return [
      { source: "/super-admin/login", destination: "/login", permanent: true },
      { source: "/super-admin/forgot", destination: "/forgot", permanent: true },
      { source: "/super-admin/reset", destination: "/reset", permanent: true },
      // System → Stripe became part of System → Payments.
      { source: "/super-admin/stripe", destination: "/super-admin/payments", permanent: false },
    ];
  },
};

export default nextConfig;

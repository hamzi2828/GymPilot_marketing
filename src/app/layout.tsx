import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Inter, Sora, Tektur } from "next/font/google";
import { SITE } from "@/content/site";
import Analytics from "@/components/marketing/Analytics";
import NavigationProgress from "@/components/NavigationProgress";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", weight: ["300", "400", "500", "600"], display: "swap" });
const tektur = Tektur({ subsets: ["latin"], variable: "--font-tektur", weight: ["500", "600"], display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["400", "500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["gym management software", "gym membership software", "class booking software", "personal training software", "gym CRM", "gym billing", "gym POS", "gym website builder"],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: SITE.url,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE.name} — ${SITE.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${sora.variable} ${geist.variable} ${tektur.variable}`}>
      <head>
        {/* Applies the saved light/dark choice before first paint, so the
            page doesn't flash dark then light. The barbell switch in the
            site header writes the same key. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("gp-theme")==="light")document.documentElement.setAttribute("data-gp-theme","light")}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans">
        {/* It reads the address (useSearchParams), which needs a boundary of
            its own or every page would stop being static. */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
        {/* Loads nothing unless an analytics id is set in the environment. */}
        <Analytics />
      </body>
    </html>
  );
}

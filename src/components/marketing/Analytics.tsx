"use client";

// Google Analytics 4 and the Meta Pixel, each loaded only when its id is set
// (lib/analytics.ts). Both count page views by themselves, including the
// moves between pages that do not reload the browser; the conversions are
// sent from the forms with trackConversion().
//
// Not on the platform panel or its sign-in pages: those are GymsPilotPro's own
// staff at work, not visitors an advert brought. Their pages also get a
// policy that lets no analytics host in (PANEL_PATHS in next.config.ts, kept
// in step with PANEL), and the links into them load a fresh page
// (FullPageLink), so a tracker loaded on the site never runs there.

import Script from "next/script";
import { usePathname } from "next/navigation";
import { GA_ID, META_PIXEL_ID } from "@/lib/analytics";

const PANEL = ["/super-admin", "/login", "/forgot", "/reset"];

export default function Analytics() {
  const pathname = usePathname() || "/";
  if (!GA_ID && !META_PIXEL_ID) return null;
  if (PANEL.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return (
    <>
      {GA_ID && (
        <>
          <Script id="ga-loader" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
          </Script>
        </>
      )}
      {META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
        </Script>
      )}
    </>
  );
}

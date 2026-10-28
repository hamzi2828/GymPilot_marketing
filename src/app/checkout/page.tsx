import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";
import { SITE } from "@/content/site";

const DESCRIPTION = `Pick a plan, add what you want to it, and tell us about your gym to start your ${SITE.name} free trial.`;

export const metadata: Metadata = {
  title: "Start your free trial",
  description: DESCRIPTION,
  alternates: { canonical: "/checkout" },
  // Its own card, so a shared checkout link names this page, not the homepage.
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: "/checkout",
    title: `Start your free trial | ${SITE.name}`,
    description: DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE.name} | ${SITE.tagline}` }],
  },
  robots: { index: false, follow: true },
};

export default function CheckoutPage() {
  return (
    // useSearchParams needs a boundary; the plan is read from ?plan=.
    <Suspense fallback={<div className="gp-site min-h-screen bg-gp-void" />}>
      <CheckoutClient />
    </Suspense>
  );
}

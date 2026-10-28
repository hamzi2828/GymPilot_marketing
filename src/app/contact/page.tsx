import type { Metadata } from "next";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import DemoForm from "@/components/marketing/DemoForm";
import { CONTACT, SITE } from "@/content/site";

const DESCRIPTION = `Contact ${SITE.name}: ask a question, book a demo or get help with a sign-up.`;

export const metadata: Metadata = {
  title: "Contact us",
  description: DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: "/contact",
    title: `${CONTACT.title} — ${SITE.name}`,
    description: DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE.name} — ${SITE.tagline}` }],
  },
};

// Every way to reach us on one page. The form needs nothing but the API, so
// this page works even when no phone, email or WhatsApp number is set.
export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="font-gp">
        <DemoForm contact />
      </main>
      <SiteFooter />
    </>
  );
}

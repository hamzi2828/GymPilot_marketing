import type { Metadata } from "next";
import { FiCheckCircle } from "react-icons/fi";
import { FEATURES, FEATURE_GROUPS, FEATURES_PAGE } from "@/content/features";
import { SITE } from "@/content/site";
import { stagger } from "@/lib/motion";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import CtaBand from "@/components/marketing/CtaBand";
import ScrollProgress from "@/components/marketing/ScrollProgress";
import Reveal from "@/components/marketing/Reveal";
import Glow from "@/components/marketing/Glow";
import Suggestions from "@/components/marketing/Suggestions";
import TargetGlow from "@/components/marketing/TargetGlow";
import AllFeatures from "@/components/marketing/AllFeatures";

// For search results: one sentence, under 160 characters.
const DESCRIPTION = `All ${FEATURES.length} ${SITE.name} features in plain English: fee collection, dues, check-in alerts, reports, the shop, classes, staff, messaging and your website.`;

export const metadata: Metadata = {
  title: "Features",
  description: DESCRIPTION,
  alternates: { canonical: "/features" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: "/features",
    title: `Every feature — ${SITE.name}`,
    description: DESCRIPTION,
    // Setting openGraph here replaces the whole inherited block, image and
    // all, so the site's card is named again.
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE.name} — ${SITE.tagline}` }],
  },
};

// The overview, after the reference's All features page: a short hero, then
// a sticky search + area bar over every feature, grouped by area, each card
// leading to its own page. Areas keep their anchors (/features#desk …) and
// cards their slugs (/features#<slug>) so the header's menu still lands on
// them. The list is a client component; this page stays static.
export default function FeaturesPage() {
  return (
    <>
      <SiteHeader />
      <main className="font-gp">
        <section className="relative overflow-x-clip bg-gp-void pb-16 pt-28 text-gp-bone sm:pt-32">
          <div className="bg-grid-dark absolute inset-x-0 top-0 h-[520px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" aria-hidden="true" />
          <Glow className="left-1/3 top-0 h-[560px] w-[1000px] -translate-x-1/2 -translate-y-1/2" color="rgb(var(--gp-mint) / 0.12)" drift="a" />
          <Glow className="-right-32 top-32 h-[420px] w-[520px]" color="rgb(var(--gp-ember) / 0.09)" drift="b" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
            <div className="max-w-3xl">
              <p className="a-rise inline-flex items-center gap-2 text-[13px] text-gp-mint" style={stagger(0)}>
                <span className="a-blink h-1.5 w-1.5 rounded-full bg-gp-mint" aria-hidden="true" />
                {FEATURES.length} features · {FEATURE_GROUPS.length} areas · all in every plan
              </p>
              <h1 className="a-rise mt-3.5 text-[38px] font-medium leading-[1.02] tracking-[-0.045em] [text-wrap:balance] sm:text-5xl lg:text-[68px]" style={stagger(1)}>
                <span className="gp-shine gp-shine-in">All features</span>
              </h1>
              <p className="a-rise mt-4 max-w-[520px] text-base text-gp-slate sm:text-lg" style={stagger(2)}>
                {FEATURES_PAGE.title} {SITE.name}: open any feature to read how it works and see it in action. Search, or pick an area.
              </p>
            </div>

            {/* No entrance transform here: it would trap the sticky search bar under the cards. */}
            <div className="mt-9">
              <AllFeatures />
            </div>
          </div>
        </section>

        {/* Missing something? Gyms tell us and we build it, free. */}
        <Suggestions compact />

        {/* Everything is in every plan */}
        <section className="bg-gp-void pb-2 pt-8">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <Reveal>
              <p className="v-rise flex items-start gap-3 rounded-[20px] border border-gp-mint/25 bg-gp-mint/[0.06] px-5 py-4 text-sm leading-relaxed text-gp-bone" style={stagger(0)}>
                <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-gp-mint" />
                {FEATURES_PAGE.note}
              </p>
            </Reveal>
          </div>
        </section>

        <CtaBand />
      </main>
      <SiteFooter />
      <ScrollProgress />
      <TargetGlow />
    </>
  );
}

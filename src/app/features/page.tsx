import type { Metadata } from "next";
import { FiCheckCircle } from "react-icons/fi";
import { FEATURES, FEATURE_GROUPS, FEATURES_PAGE, featuresIn } from "@/content/features";
import { SITE } from "@/content/site";
import { stagger } from "@/lib/motion";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import CtaBand from "@/components/marketing/CtaBand";
import ScrollProgress from "@/components/marketing/ScrollProgress";
import FeatureCard from "@/components/marketing/FeatureCard";
import Reveal from "@/components/marketing/Reveal";
import Glow from "@/components/marketing/Glow";
import FeatureGroupsGrid from "@/components/marketing/FeatureGroupsGrid";
import Suggestions from "@/components/marketing/Suggestions";

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

// The overview: every feature, grouped the way an owner thinks about the
// gym, each one a card that leads to its own page. Groups have anchors
// (/features#desk …) so the header's menu can point straight at them.
export default function FeaturesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Header and Jump to, in one dark band: what the page is, then every
            area as a card a buyer can jump into (do you do receipts?). */}
        <section className="relative overflow-hidden border-b border-white/10 bg-slate-950 pb-14 pt-28 text-white sm:pt-32">
          <div className="bg-grid-dark absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_35%,transparent_80%)]" aria-hidden="true" />
          <Glow className="left-1/2 top-0 h-[620px] w-[1100px] -translate-x-1/2 -translate-y-1/2" color="rgba(79,70,229,0.38)" drift="a" />
          <Glow className="-right-32 top-40 h-[420px] w-[520px]" color="rgba(217,70,239,0.22)" drift="b" />
          <Glow className="-left-40 bottom-0 h-[420px] w-[520px]" color="rgba(16,185,129,0.12)" drift="b" />
          <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
            <span className="a-rise inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-medium text-slate-300" style={stagger(0)}>
              <span className="a-blink h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              {FEATURES.length} features · {FEATURE_GROUPS.length} areas · all in every plan
            </span>
            <h1 className="a-rise mt-5 font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl lg:text-6xl" style={stagger(1)}>
              {FEATURES_PAGE.title} <span className="text-gradient">{SITE.name}</span>
            </h1>
            <p className="a-rise mx-auto mt-4 max-w-xl text-base text-slate-400 sm:text-lg" style={stagger(2)}>
              {FEATURES_PAGE.hint}
            </p>
          </div>
          <nav aria-label="Feature groups" className="relative mx-auto mt-10 max-w-7xl px-5 sm:px-8">
            <FeatureGroupsGrid variant="cards" />
          </nav>
        </section>

        {/* Every feature, by group */}
        {FEATURE_GROUPS.map((group, gi) => {
          const items = featuresIn(group.key);
          return (
            <section key={group.key} id={group.key} aria-labelledby={`${group.key}-title`} className={`scroll-mt-20 py-10 sm:py-12 ${gi % 2 === 1 ? "bg-slate-50" : "bg-white"}`}>
              <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <Reveal className="max-w-2xl">
                  <p className="v-rise flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600" style={stagger(0)}>
                    <span className="v-pop inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white" style={stagger(0)}>
                      {gi + 1}
                    </span>
                    {group.label}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-normal text-slate-500">{items.length} features</span>
                  </p>
                  <h2 id={`${group.key}-title`} className="v-rise mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-slate-900 sm:text-3xl" style={stagger(1)}>
                    {group.title}
                  </h2>
                  <span className="v-fill mt-2.5 block h-1 w-10 origin-left rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500" style={stagger(2)} aria-hidden="true" />
                  <p className="v-rise mt-2.5 text-base leading-relaxed text-slate-600" style={stagger(3)}>
                    {group.text}
                  </p>
                </Reveal>

                {/* Each card comes in as its own row scrolls into view, the
                    cards of a row one after another, so a long group builds
                    up step by step instead of appearing as one block. */}
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((feature, i) => (
                    <Reveal key={feature.key} className="h-full">
                      <FeatureCard feature={feature} index={i % 3} anchored />
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        {/* Missing something? Gyms tell us and we build it, free. */}
        <Suggestions compact />

        {/* Everything is in every plan */}
        <section className="bg-white pb-2 pt-8">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <Reveal>
              <p className="v-rise flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-relaxed text-emerald-900" style={stagger(0)}>
                <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                {FEATURES_PAGE.note}
              </p>
            </Reveal>
          </div>
        </section>

        <CtaBand />
      </main>
      <SiteFooter />
      <ScrollProgress />
    </>
  );
}

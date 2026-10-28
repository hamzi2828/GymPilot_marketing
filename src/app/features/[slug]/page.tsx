import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowRight, FiCheck, FiChevronRight } from "react-icons/fi";
import { FEATURES, featureBySlug, groupOf, relatedTo } from "@/content/features";
import { SITE } from "@/content/site";
import { stagger } from "@/lib/motion";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import CtaBand from "@/components/marketing/CtaBand";
import ScrollProgress from "@/components/marketing/ScrollProgress";
import FeatureCard from "@/components/marketing/FeatureCard";
import { FEATURE_PICTURES } from "@/components/marketing/FeaturePictures";
import { FEATURE_ICONS, FEATURE_TINTS } from "@/components/marketing/featureIcons";
import Reveal from "@/components/marketing/Reveal";
import Glow from "@/components/marketing/Glow";

type Params = { slug: string };

// One page per feature, built at deploy time from content/features.ts. Any
// other address under /features/ is a 404 rather than an empty page.
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return FEATURES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const feature = featureBySlug(slug);
  if (!feature) return {};
  const url = `/features/${feature.slug}`;
  const title = `${feature.title} — ${SITE.name}`;
  return {
    title: `${feature.name} · Features`,
    description: feature.text,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: SITE.name, url, title, description: feature.text },
    twitter: { card: "summary_large_image", title, description: feature.text },
  };
}

export default async function FeaturePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const feature = featureBySlug(slug);
  if (!feature) notFound();

  const group = groupOf(feature);
  const related = relatedTo(feature);
  const Icon = FEATURE_ICONS[feature.key];
  const Picture = FEATURE_PICTURES[feature.key];

  // Breadcrumbs for search results. Static content only, so safe to inline.
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Features", item: `${SITE.url}/features` },
      { "@type": "ListItem", position: 2, name: group.label, item: `${SITE.url}/features#${group.key}` },
      { "@type": "ListItem", position: 3, name: feature.name, item: `${SITE.url}/features/${feature.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <SiteHeader />
      <main className="font-gp">
        {/* What it is, in one breath, beside a piece of the real screen. */}
        <section className="relative overflow-hidden border-b border-gp-edge bg-gp-void pb-16 pt-28 text-gp-bone sm:pb-20 sm:pt-32">
          <div className="bg-grid-dark absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" aria-hidden="true" />
          <Glow className="left-1/3 top-0 h-[560px] w-[900px] -translate-x-1/2 -translate-y-1/2" color="rgb(var(--gp-mint) / 0.12)" drift="a" />
          <Glow className="-right-40 top-32 h-[420px] w-[520px]" color="rgb(var(--gp-ember) / 0.09)" drift="b" />

          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <nav aria-label="Breadcrumb" className="a-rise" style={stagger(0)}>
              <ol className="flex flex-wrap items-center gap-1.5 text-[13.5px] text-gp-slate">
                <li>
                  <Link href="/features" className="rounded transition-colors hover:text-gp-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gp-mint">
                    Features
                  </Link>
                </li>
                <li aria-hidden="true">
                  <FiChevronRight className="h-3.5 w-3.5 text-gp-slate/60" />
                </li>
                <li>
                  <Link href={`/features#${group.key}`} className="rounded transition-colors hover:text-gp-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gp-mint">
                    {group.label}
                  </Link>
                </li>
                <li aria-hidden="true">
                  <FiChevronRight className="h-3.5 w-3.5 text-gp-slate/60" />
                </li>
                <li aria-current="page" className="font-medium text-gp-bone">
                  {feature.name}
                </li>
              </ol>
            </nav>

            <div className="mt-10 grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
              <div>
                <div className="a-rise flex flex-wrap items-center gap-3" style={stagger(1)}>
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ${FEATURE_TINTS[feature.key]}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[13px] text-gp-mint">{feature.name}</span>
                  {feature.addon && <span className="rounded-full bg-gp-ember/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-gp-ember ring-1 ring-inset ring-gp-ember/30">Add-on</span>}
                </div>
                <h1 className="a-rise gp-shine gp-shine-in mt-5 pb-1 text-4xl font-medium leading-[1.04] tracking-[-0.045em] [text-wrap:balance] sm:text-5xl lg:text-[60px]" style={stagger(2)}>
                  {feature.title}
                </h1>
                <p className="a-rise mt-5 max-w-xl text-lg leading-relaxed text-gp-slate" style={stagger(3)}>
                  {feature.text}
                </p>
                <div className="a-rise mt-8 flex flex-col gap-3 sm:flex-row" style={stagger(4)}>
                  <Link href="/#demo" className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gp-bone px-[22px] text-[15px] font-medium text-gp-ink transition-transform duration-300 hover:-translate-y-0.5">
                    Book a demo <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link href="/#pricing" className="inline-flex h-12 items-center justify-center rounded-xl border border-gp-edge-2 bg-gp-raised px-[22px] text-[15px] font-medium text-gp-bone shadow-[inset_0_1px_0_rgb(var(--gp-bone)_/_0.06)] transition-colors hover:border-gp-mint/50">
                    See pricing
                  </Link>
                </div>
              </div>

              {Picture && (
                <Reveal className="relative">
                  <div className="v-tilt rounded-[28px] border border-gp-edge-2 bg-gradient-to-b from-gp-graphite to-gp-void p-2 shadow-[0_40px_80px_-40px_rgb(var(--gp-mint)_/_0.25)]">
                    <Picture />
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </section>

        {/* The longer story, then the list. */}
        <section className="bg-gp-void py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
            <Reveal>
              <h2 className="v-rise text-2xl font-medium tracking-[-0.03em] text-gp-bone sm:text-[32px]" style={stagger(0)}>
                How it works
              </h2>
              <span className="v-fill mt-4 block h-1 w-12 origin-left rounded-full bg-gradient-to-r from-gp-mint to-gp-ember" style={stagger(1)} aria-hidden="true" />
              <div className="mt-6 space-y-5 text-base leading-relaxed text-gp-mist sm:text-lg">
                {feature.body.map((paragraph, i) => (
                  <p key={i} className="v-rise" style={stagger(2 + i)}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="rounded-[20px] border border-gp-edge bg-gp-graphite p-6 sm:p-8">
                <h2 className="v-rise text-[13px] text-gp-slate" style={stagger(0)}>
                  What it does
                </h2>
                <ul className="mt-5 space-y-3">
                  {feature.points.map((p, i) => (
                    <li key={p} className="v-rise flex items-start gap-3 text-[15px] text-gp-bone" style={stagger(1 + i)}>
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gp-mint/15 text-gp-mint">
                        <FiCheck className="h-3 w-3" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>

                <div className="v-rise mt-7 border-t border-gp-edge pt-5" style={stagger(7)}>
                  <h3 className="text-[12.5px] text-gp-slate">Where you find it</h3>
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {feature.screens.map((s) => (
                      <li key={s} className="rounded-lg bg-gp-bone/[0.04] px-2 py-1 text-[11.5px] text-gp-mist ring-1 ring-gp-edge">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Where to go next. */}
        {related.length > 0 && (
          <section aria-labelledby="related-title" className="border-t border-gp-edge bg-gp-graphite/40 py-16 sm:py-20">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
              <Reveal className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="v-rise text-[13px] text-gp-mint" style={stagger(0)}>
                    Goes well with
                  </p>
                  <h2 id="related-title" className="v-rise mt-2 text-2xl font-medium tracking-[-0.03em] text-gp-bone sm:text-[32px]" style={stagger(1)}>
                    Related features
                  </h2>
                </div>
                <div className="v-rise flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium" style={stagger(2)}>
                  <Link href={`/features#${group.key}`} className="inline-flex items-center gap-1.5 rounded text-gp-mist transition-colors hover:text-gp-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gp-mint">
                    More in {group.label}
                  </Link>
                  <Link href="/features" className="group inline-flex items-center gap-1.5 rounded text-gp-mint transition-colors hover:text-gp-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gp-mint">
                    All features <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </Reveal>

              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {related.map((f, i) => (
                  <Reveal key={f.key} className="h-full">
                    <FeatureCard feature={f} index={i % 3} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        <CtaBand />
      </main>
      <SiteFooter />
      <ScrollProgress />
    </>
  );
}

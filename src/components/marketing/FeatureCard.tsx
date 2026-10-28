import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import type { Feature } from "@/content/features";
import { stagger } from "@/lib/motion";
import { FEATURE_ICONS, FEATURE_TINTS } from "./featureIcons";

// One feature as a card that leads to its own page: its name and a few
// plain words, nothing more -- the detail is one tap away. The whole card
// is the target (the heading's link is stretched over it), so a tap
// anywhere lands, but screen readers still hear only the feature's name.
// `anchored` gives the card the feature's slug as its id, so /features#<slug>
// slides straight to it (and it glows for a moment) -- used on /features only.
export default function FeatureCard({ feature, index = 0, headingLevel = "h3", anchored = false }: { feature: Feature; index?: number; headingLevel?: "h2" | "h3"; anchored?: boolean }) {
  const Icon = FEATURE_ICONS[feature.key];
  const Heading = headingLevel;

  return (
    <article
      id={anchored ? feature.slug : undefined}
      className="feature-anchor v-rise group relative isolate scroll-mt-24 flex h-full flex-col rounded-[20px] border border-gp-edge bg-gp-graphite p-5 font-gp transition-all duration-500 before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[20px] before:bg-[radial-gradient(300px_160px_at_0%_0%,rgb(var(--gp-mint)_/_0.12),transparent_70%)] before:opacity-0 before:transition-opacity before:duration-500 before:content-[''] focus-within:ring-2 focus-within:ring-gp-mint focus-within:ring-offset-2 focus-within:ring-offset-gp-void hover:-translate-y-1 hover:border-gp-mint/40 hover:shadow-[0_26px_50px_-30px_rgb(var(--gp-mint)_/_0.6)] hover:before:opacity-100 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={stagger(index % 6)}
    >
      {/* Icon and name on one line keeps the card short. */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transition-none ${FEATURE_TINTS[feature.key]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <Heading className="min-w-0 text-lg font-medium leading-snug tracking-[-0.02em] text-gp-bone">
          <Link href={`/features/${feature.slug}`} className="outline-none before:absolute before:inset-0 before:rounded-2xl before:content-['']">
            {feature.name}
          </Link>
        </Heading>
        {feature.addon && <span className="ml-auto shrink-0 rounded-full border border-gp-ember/30 bg-gp-ember/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-gp-ember">Add-on</span>}
      </div>
      <p className="mt-2.5 text-[14.5px] leading-relaxed text-gp-mist">{feature.short}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[13px] font-medium text-gp-mint" aria-hidden="true">
        Read more <FiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
      </span>
    </article>
  );
}

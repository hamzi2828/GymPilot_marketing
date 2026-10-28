import { BENEFITS } from "@/content/site";
import { stagger } from "@/lib/motion";
import { FEATURE_ICONS, FEATURE_TINTS } from "./featureIcons";
import { BENEFIT_SCENES } from "./BenefitScenes";
import Reveal from "./Reveal";
import ViewAllFeaturesButton from "./ViewAllFeaturesButton";
import SectionHeading from "./SectionHeading";

// What a gym owner gets out of it: six outcomes, a sentence each, to read
// rather than click -- the header's Features lands here. A landing page that
// lists every feature stops being read, so one button under the cards leads
// to the full list on /features, where each feature has its own page.
export default function Benefits() {
  return (
    <section id="helps" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading eyebrow={BENEFITS.eyebrow} title={BENEFITS.title} text={BENEFITS.text} />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.items.map((item, i) => {
            const Icon = FEATURE_ICONS[item.key];
            const Scene = BENEFIT_SCENES[item.key];
            return (
              <Reveal key={item.key} delay={(i % 3) * 80} as="li">
                <div className="relative h-full rounded-2xl border border-gp-edge-2 bg-gp-panel p-6">
                  {/* The outcome, acted out in a small loop above the words. */}
                  {Scene && (
                    <div className="mb-5 h-28 overflow-hidden rounded-xl bg-gp-void ring-1 ring-inset ring-gp-bone/10" aria-hidden="true">
                      <Scene />
                    </div>
                  )}
                  <span className={`v-pop inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ${FEATURE_TINTS[item.key]}`} style={stagger(0)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="v-rise mt-4 font-gp text-xl font-semibold tracking-tight text-gp-bone" style={stagger(1)}>
                    {item.title}
                  </h3>
                  <p className="v-rise mt-2 text-base leading-relaxed text-gp-mist" style={stagger(2)}>
                    {item.text}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ul>

        <Reveal delay={200} className="mt-10 flex justify-center">
          <ViewAllFeaturesButton size="lg" revealed />
        </Reveal>
      </div>
    </section>
  );
}

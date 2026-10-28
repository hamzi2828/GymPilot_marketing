import { TESTIMONIALS } from "@/content/site";
import { stagger } from "@/lib/motion";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

export default function Testimonials() {
  // A sample quote is placeholder copy, not something a customer said: it is
  // never shown as one. With no real quotes the section is left out.
  const quotes = TESTIMONIALS.filter((t) => !t.sample);
  if (!quotes.length) return null;
  return (
    <section className="py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading eyebrow="What owners notice first" title="Less admin. More floor time." />
        <ul className="mt-14 grid gap-5 md:grid-cols-3">
          {quotes.map((t, i) => (
            <Reveal key={t.quote} delay={i * 100} as="li">
              <figure className="flex h-full flex-col rounded-2xl border border-gp-edge-2 bg-gp-panel p-7 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gp-raised hover:shadow-lift">
                <span className="v-pop font-gp text-5xl leading-none text-gp-mint" style={stagger(0)} aria-hidden="true">
                  “
                </span>
                <blockquote className="v-rise mt-2 flex-1 text-base leading-relaxed text-gp-bone" style={stagger(1)}>
                  {t.quote}
                </blockquote>
                <figcaption className="v-rise mt-6 flex items-center gap-3" style={stagger(2)}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gp-mint to-gp-ember text-sm font-bold text-gp-ink">{t.who[0]}</span>
                  <span>
                    <span className="block text-sm font-semibold text-gp-bone">{t.who}</span>
                    <span className="block text-xs text-gp-slate">{t.where}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

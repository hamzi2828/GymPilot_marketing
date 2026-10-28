import Link from "next/link";
import { FaRegLightbulb, FaWhatsapp } from "react-icons/fa";
import { FiArrowRight, FiGift, FiMessageCircle, FiUsers } from "react-icons/fi";
import { SUGGESTIONS } from "@/content/site";
import { stagger } from "@/lib/motion";
import Reveal from "./Reveal";
import Glow from "./Glow";

const ICONS = [FiMessageCircle, FiUsers, FiGift];
const TINTS = ["from-gp-mint to-gp-mint/60", "from-gp-ember to-gp-ember/60", "from-gp-violet to-gp-blue"];
const RINGS = ["bg-gp-mint/50", "bg-gp-ember/50", "bg-gp-violet/50"];

// Where each sparkle sits round the bulb, and when it twinkles.
const SPARKS = [
  { className: "-right-2.5 -top-2.5 h-4 w-4", delay: "0s" },
  { className: "-left-3 top-1 h-2.5 w-2.5", delay: "0.9s" },
  { className: "-bottom-2 -right-1 h-3 w-3", delay: "1.7s" },
];

// The idea: a bulb that floats and glows, with sparkles twinkling round it.
function Bulb() {
  return (
    <span className="v-pop relative inline-flex h-14 w-14 shrink-0" style={stagger(0)} aria-hidden="true">
      <span className="a-halo absolute -inset-4 rounded-full opacity-60" style={{ background: "radial-gradient(closest-side, rgb(var(--gp-ember) / 0.6), transparent)" }} />
      <span className="a-float relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gp-ember to-gp-ember/70 text-gp-ink shadow-lg shadow-gp-ember/30">
        <FaRegLightbulb className="h-6 w-6" />
      </span>
      {SPARKS.map((s) => (
        <svg key={s.delay} viewBox="0 0 24 24" className={`a-twinkle absolute text-gp-ember ${s.className}`} style={{ animationDelay: s.delay }}>
          <path fill="currentColor" d="M12 0Q13.5 10.5 24 12Q13.5 13.5 12 24Q10.5 13.5 0 12Q10.5 10.5 12 0Z" />
        </svg>
      ))}
    </span>
  );
}

// Gyms tell us what would make GymsPilotPro easier, and we build it at no
// extra cost: on the landing page and, `compact`, on /features. The card
// rises in as it scrolls into view, then the three steps one after another;
// a ring runs down their icons in turn (idea, plan, free for everyone).
// Everything holds still for anyone who has asked for reduced motion.
export default function Suggestions({ compact = false }: { compact?: boolean }) {
  return (
    <section id="suggestions" aria-labelledby="suggestions-title" className={`scroll-mt-20 ${compact ? "py-10 sm:py-14" : "py-20 sm:py-24"}`}>
      <div className={`mx-auto px-5 sm:px-8 ${compact ? "max-w-7xl" : "max-w-6xl"}`}>
        <Reveal>
          <div className={`relative overflow-hidden rounded-[2rem] border border-gp-edge-2 bg-gradient-to-br from-gp-mint/[0.07] via-gp-panel to-gp-ember/[0.07] p-5 shadow-[0_0_0_1px_rgb(var(--gp-mint)/0.25),0_20px_60px_-20px_rgb(var(--gp-mint)/0.45)] sm:p-10 ${compact ? "lg:p-12" : "lg:p-14"}`}>
            <div className="bg-grid-dark absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black_15%,transparent_65%)]" aria-hidden="true" />
            <Glow className="-right-28 -top-28 h-[420px] w-[420px]" color="rgb(var(--gp-ember) / 0.14)" drift="a" />
            <Glow className="-bottom-36 -left-28 h-[460px] w-[460px]" color="rgb(var(--gp-mint) / 0.14)" drift="b" />

            <div className="relative grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14">
              <div>
                <div className="flex items-center gap-4">
                  <Bulb />
                  <p className="v-rise text-xs font-semibold uppercase tracking-[0.18em] text-gp-mint" style={stagger(1)}>
                    {SUGGESTIONS.eyebrow}
                  </p>
                </div>
                <h2 id="suggestions-title" className={`v-rise mt-6 font-gp font-semibold tracking-[-0.02em] gp-shine ${compact ? "text-3xl sm:text-4xl" : "text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"}`} style={stagger(2)}>
                  {SUGGESTIONS.title} <span className="whitespace-nowrap bg-gradient-to-r from-gp-mint to-gp-ember bg-clip-text text-transparent">{SUGGESTIONS.highlight}</span>
                </h2>
                <span className="v-fill mt-4 block h-1 w-12 origin-left rounded-full bg-gradient-to-r from-gp-mint to-gp-ember" style={stagger(3)} aria-hidden="true" />
                <p className="v-rise mt-4 text-base leading-relaxed text-gp-mist sm:text-lg" style={stagger(4)}>
                  {SUGGESTIONS.text}
                </p>
                <div className="v-rise mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center" style={stagger(5)}>
                  <Link
                    href={SUGGESTIONS.cta.href}
                    className="btn-shine group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gp-bone px-7 text-sm font-semibold text-gp-ink shadow-lg shadow-gp-bone/10 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gp-mint focus-visible:ring-offset-2 focus-visible:ring-offset-gp-void"
                  >
                    {SUGGESTIONS.cta.label} <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  {SUGGESTIONS.whatsappUrl && (
                    <a
                      href={SUGGESTIONS.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-gp-mint/30 bg-gp-panel px-6 text-sm font-semibold text-gp-mint transition-colors hover:border-gp-mint/50 hover:bg-gp-mint/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gp-mint"
                    >
                      <FaWhatsapp className="h-4 w-4" aria-hidden="true" /> {SUGGESTIONS.whatsapp}
                    </a>
                  )}
                </div>
              </div>

              <ol className="space-y-3">
                {SUGGESTIONS.points.map((point, i) => {
                  const Icon = ICONS[i];
                  return (
                    <Reveal key={point.title} as="li" delay={150 + i * 140}>
                      <div className="flex items-start gap-4 rounded-2xl bg-gp-panel p-4 shadow-card ring-1 ring-gp-bone/10 transition-transform duration-300 hover:-translate-y-0.5 sm:p-5">
                        <span className="relative inline-flex h-11 w-11 shrink-0" aria-hidden="true">
                          <span className={`a-ping-ring absolute inset-0 rounded-xl ${RINGS[i]}`} style={{ animationDelay: `${i * 0.8}s` }} />
                          <span className={`relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${TINTS[i]} text-gp-ink shadow-lg`}>
                            <Icon className="h-5 w-5" />
                          </span>
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-gp text-base font-semibold tracking-tight text-gp-bone sm:text-lg">{point.title}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-gp-mist">{point.text}</p>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </ol>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

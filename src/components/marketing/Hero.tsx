import { FaWhatsapp } from "react-icons/fa";
import { FiBell, FiCheck, FiCheckCircle, FiChevronRight, FiGlobe, FiUsers } from "react-icons/fi";
import { FOOTER, HERO, SITE } from "@/content/site";
import { stagger } from "@/lib/motion";
import { Wordmark } from "./Brand";
import HeroRibbon from "./HeroRibbon";

// What the product does, as things happening at a gym, one after another
// under the buttons (globals.css: .a-hero-ticker). The first line comes
// again at the end so the loop wraps without a jump; reduced motion shows
// the first one only.
const LIVE = [
  { icon: FiCheckCircle, tint: "text-gp-mint", text: "Ali paid Rs 4,900 at the desk" },
  { icon: FiCheck, tint: "text-gp-mint", text: "Sara checked in by QR code" },
  { icon: FiUsers, tint: "text-gp-ember", text: "HIIT at 18:00 is full" },
  { icon: FiBell, tint: "text-gp-ember", text: "Fee reminder sent to 24 members" },
  { icon: FiGlobe, tint: "text-gp-mint", text: "New member joined from your website" },
];

function LiveTicker() {
  return (
    <div className="a-rise mt-7 inline-flex max-w-full items-center gap-3 rounded-full border border-gp-edge bg-gp-bone/[0.03] py-1.5 pl-2 pr-4 text-[13px]" style={stagger(6)}>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gp-mint/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-gp-mint">
        <span className="a-blink h-1.5 w-1.5 rounded-full bg-gp-mint" aria-hidden="true" /> Live
      </span>
      <span className="relative h-6 min-w-0 overflow-hidden text-left" aria-label={LIVE.map((l) => l.text).join(". ")}>
        <span className="a-hero-ticker block" aria-hidden="true">
          {[...LIVE, LIVE[0]].map((l, i) => {
            const Icon = l.icon;
            return (
              <span key={i} className="flex h-6 items-center gap-2 truncate text-gp-mist">
                <Icon className={`h-3.5 w-3.5 shrink-0 ${l.tint}`} /> {l.text}
              </span>
            );
          })}
        </span>
      </span>
    </div>
  );
}

const BTN = "group inline-flex h-12 items-center justify-center gap-2.5 whitespace-nowrap rounded-xl px-[22px] text-[15px] font-medium transition-[box-shadow,transform] duration-300 active:scale-[0.97]";

export default function Hero() {
  return (
    <section id="product" className="relative overflow-hidden pt-[120px] text-center font-gp text-gp-bone sm:pt-[150px]">
      {/* two faint pools of light at the top of the page (dark mode only) */}
      <div className="gp-hero-pools pointer-events-none absolute inset-x-[-10%] top-[-20%] h-[70%]" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1180px] px-4 sm:px-6">
        <p className="a-rise inline-flex max-w-full items-center gap-2.5 text-[13px] text-gp-slate" style={stagger(0)}>
          <i className="h-1.5 w-1.5 shrink-0 rounded-full bg-gp-mint shadow-[0_0_12px_rgb(var(--gp-mint))]" aria-hidden="true" />
          <b className="font-medium text-gp-mist">{HERO.eyebrow}</b>
        </p>

        <h1 className="gp-shine gp-shine-in mx-auto my-[22px] max-w-[900px] text-balance text-[clamp(42px,7vw,88px)] font-medium leading-[1.02] tracking-[-0.045em]">{HERO.title.join(" ")}</h1>

        <p className="a-rise mx-auto mb-[34px] max-w-[560px] text-[17px] leading-relaxed text-gp-slate sm:text-lg" style={stagger(3)}>
          {HERO.lead}
        </p>

        <div className="a-rise flex flex-wrap justify-center gap-2.5" style={stagger(4)}>
          <a href={HERO.primary.href} className={`${BTN} gp-btn-light bg-gp-bone text-gp-ink`}>
            {HERO.primary.label} <FiChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[3px]" aria-hidden="true" />
          </a>
          <a href={HERO.secondary.href} className={`${BTN} gp-btn-dark border border-gp-edge-2 text-gp-bone`}>
            {HERO.secondary.label}
          </a>
        </div>

        <ul className="mt-[26px] flex flex-wrap justify-center gap-x-[22px] gap-y-2 text-sm text-gp-slate">
          {HERO.trust.map((t, i) => (
            <li key={t} className="a-rise inline-flex items-center gap-[7px]" style={stagger(5 + i)}>
              <FiCheck className="h-[15px] w-[15px] text-gp-mint" aria-hidden="true" /> {t}
            </li>
          ))}
        </ul>

        <LiveTicker />

        {(SITE.whatsappUrl || SITE.demoGymUrl) && (
          <p className="a-rise mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-gp-slate" style={stagger(7)}>
            {SITE.whatsappUrl && (
              <span>
                Prefer to chat?{" "}
                <a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-gp-mist underline-offset-4 hover:text-gp-bone hover:underline">
                  <FaWhatsapp className="h-3.5 w-3.5 text-gp-mint" aria-hidden="true" /> Message us on WhatsApp
                </a>
              </span>
            )}
            {SITE.demoGymUrl && (
              <span>
                Want to poke around first?{" "}
                <a href={SITE.demoGymUrl} target="_blank" rel="noreferrer" className="font-medium text-gp-mist underline-offset-4 hover:text-gp-bone hover:underline">
                  Open a live demo gym
                </a>
              </span>
            )}
          </p>
        )}
      </div>

      <HeroRibbon className="a-rise mt-2.5 h-[clamp(240px,34vw,420px)]" />

      <div className="relative mx-auto max-w-[1180px] px-4 sm:px-6">
        <div className="relative mx-auto -mt-[60px] max-w-[820px] rounded-3xl border border-b-0 gp-hero-glass border-gp-edge px-[22px] pb-9 pt-[38px] sm:-mt-[90px] sm:px-12 sm:pb-[52px] sm:pt-14">
          <Wordmark mark className="justify-center ![font-size:clamp(30px,5vw,54px)]" />
          <p className="mx-auto mt-6 max-w-[560px] text-[17px] leading-relaxed text-gp-mist">{FOOTER.blurb}</p>
        </div>
      </div>
    </section>
  );
}

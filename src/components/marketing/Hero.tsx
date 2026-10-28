import { FaWhatsapp } from "react-icons/fa";
import { FiCheck, FiChevronRight } from "react-icons/fi";
import { FOOTER, HERO, SITE } from "@/content/site";
import { stagger } from "@/lib/motion";
import { Wordmark } from "./Brand";
import HeroRibbon from "./HeroRibbon";

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

        {SITE.whatsappUrl && (
          <p className="a-rise mt-6 text-[13px] text-gp-slate" style={stagger(7)}>
            Prefer to chat?{" "}
            <a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-gp-mist underline-offset-4 hover:text-gp-bone hover:underline">
              <FaWhatsapp className="h-3.5 w-3.5 text-gp-mint" aria-hidden="true" /> Message us on WhatsApp
            </a>
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

import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";
import { stagger } from "@/lib/motion";
import Reveal from "./Reveal";

const BTN = "group inline-flex h-12 items-center justify-center gap-2.5 whitespace-nowrap rounded-xl px-[22px] text-[15px] font-medium transition-[box-shadow,transform] duration-300 active:scale-[0.97]";

export default function CtaBand() {
  return (
    <section className="py-20 font-gp sm:py-24">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gp-edge bg-gp-graphite px-6 py-16 text-center sm:px-16">
            {/* a mint and an amber pool of light, and a hairline across the top */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_70%_at_20%_0%,rgb(var(--gp-mint)/0.14),transparent_70%),radial-gradient(40%_60%_at_85%_100%,rgb(var(--gp-ember)/0.12),transparent_70%)]" aria-hidden="true" />
            <span className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gp-bone/30 to-transparent" aria-hidden="true" />
            <div className="relative">
              <h2 className="v-rise gp-shine mx-auto max-w-3xl text-balance text-[clamp(30px,4.4vw,52px)] font-medium leading-[1.05] tracking-[-0.04em]" style={stagger(0)}>
                Ready to run your gym from one place?
              </h2>
              <p className="v-rise mx-auto mt-4 max-w-xl text-base leading-relaxed text-gp-slate sm:text-lg" style={stagger(1)}>
                Book a demo and see your timetable, memberships and website on GymsPilotPro before you decide anything.
              </p>
              <div className="v-rise mt-8 flex flex-wrap justify-center gap-2.5" style={stagger(2)}>
                {/* Always absolute: this band appears on more than one page. */}
                <Link href="/#demo" className={`${BTN} gp-btn-light bg-gp-bone text-gp-ink`}>
                  Book a demo <FiChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[3px]" aria-hidden="true" />
                </Link>
                <Link href="/#pricing" className={`${BTN} gp-btn-dark border border-gp-edge-2 text-gp-bone`}>
                  See pricing
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

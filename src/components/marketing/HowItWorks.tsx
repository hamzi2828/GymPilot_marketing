import type { CSSProperties } from "react";
import { FiArrowRight, FiCheck, FiCheckCircle, FiLock, FiUserPlus } from "react-icons/fi";
import { HOW_IT_WORKS, STEPS } from "@/content/site";
import { stagger } from "@/lib/motion";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import Glow from "./Glow";

// The three steps happen in turn on one 6s loop (globals.css): each number
// lights up as its step starts, and a small scene below the words acts the
// step out. Decorative, and still for anyone who asked for reduced motion.
const STARTS = [0.3, 2.2, 4.0];
const at = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` });

// 1. We set up your gym: the setup runs, and its three parts tick off.
function SetupScene() {
  const t = STARTS[0];
  return (
    <div className="space-y-2">
      <div className="h-1.5 overflow-hidden rounded-full bg-gp-bone/10">
        <span className="a-hw-fill block h-full rounded-full bg-gradient-to-r from-gp-mint to-gp-ember" style={at(t)} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {["Website", "Member portal", "Admin area"].map((part, i) => (
          <span key={part} className="a-wyg-build inline-flex items-center gap-1 rounded-full bg-gp-mint/15 px-2.5 py-1 text-[11px] font-medium text-gp-mint ring-1 ring-inset ring-gp-mint/30" style={at(t + 0.5 + i * 0.35)}>
            <FiCheck className="h-3 w-3" /> {part}
          </span>
        ))}
      </div>
    </div>
  );
}

// 2. We connect your web address: it types itself, the padlock turns green.
function DomainScene() {
  const t = STARTS[1];
  return (
    <div className="flex items-center gap-2">
      <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-gp-bone/[0.07] px-2.5 py-1.5 font-mono text-[11px] text-gp-bone ring-1 ring-inset ring-gp-bone/10">
        <span className="relative inline-flex h-3.5 w-3.5 shrink-0">
          <FiLock className="h-3.5 w-3.5 text-gp-slate" />
          <FiLock className="a-wyg-build absolute inset-0 h-3.5 w-3.5 text-gp-mint" style={at(t + 1)} />
        </span>
        <span className="a-wyg-type inline-block overflow-hidden whitespace-nowrap" style={at(t - 0.2)}>yourgym.com</span>
        <span className="a-blink inline-block h-3 w-px bg-gp-mist" />
      </span>
      <span className="a-wyg-tick shrink-0 rounded-full bg-gp-mint px-2.5 py-1 text-[10px] font-bold text-gp-ink" style={at(t + 1.2)}>
        Connected
      </span>
    </div>
  );
}

// 3. Start selling: the first member joins and the first payment lands.
function SellScene() {
  const t = STARTS[2];
  return (
    <div className="space-y-1.5">
      <span className="a-bn-slide flex items-center gap-2 rounded-lg bg-gp-bone/[0.07] px-2.5 py-1.5 text-[11px] text-gp-bone ring-1 ring-inset ring-gp-bone/10" style={at(t)}>
        <FiUserPlus className="h-3.5 w-3.5 text-gp-ember" /> New member joined
      </span>
      <span className="a-bn-slide flex items-center justify-between gap-2 rounded-lg bg-gp-bone/[0.07] px-2.5 py-1.5 text-[11px] text-gp-bone ring-1 ring-inset ring-gp-bone/10" style={at(t + 0.5)}>
        <span className="inline-flex items-center gap-2">
          <FiCheckCircle className="h-3.5 w-3.5 text-gp-mint" /> Payment received
        </span>
        <span className="font-semibold text-gp-mint">Rs 4,900</span>
      </span>
    </div>
  );
}

const SCENES = [SetupScene, DomainScene, SellScene];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-gp-graphite py-24 text-gp-bone sm:py-28">
      <div className="bg-grid-dark absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" aria-hidden="true" />
      <Glow className="left-1/2 top-1/2 h-[680px] w-[1100px] -translate-x-1/2 -translate-y-1/2" color="rgb(var(--gp-mint) / 0.12)" drift="a" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading dark eyebrow={HOW_IT_WORKS.eyebrow} title={HOW_IT_WORKS.title} text={HOW_IT_WORKS.text} />

        <ol className="relative mt-16 grid gap-6 md:grid-cols-3 md:gap-5">
          {STEPS.map((step, i) => {
            const Scene = SCENES[i];
            return (
            <Reveal key={step.title} delay={i * 140} as="li" className="relative">
              <div className="group relative h-full rounded-3xl border border-gp-edge-2 bg-gp-bone/[0.04] p-7 transition-colors duration-300 hover:bg-gp-bone/[0.08] md:p-8">
                <div className="flex items-center gap-4">
                  <span className="v-pop relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gp-mint to-gp-mint/60 font-gp text-lg font-bold text-gp-ink shadow-[0_0_0_1px_rgb(var(--gp-mint)/0.25),0_20px_60px_-20px_rgb(var(--gp-mint)/0.45)] transition-transform duration-300 group-hover:scale-110" style={stagger(0)}>
                    <span className="a-hw-step absolute inset-0 rounded-2xl" style={at(STARTS[i])} aria-hidden="true" />
                    {i + 1}
                  </span>
                  <h3 className="v-rise font-gp text-xl font-semibold leading-tight tracking-tight sm:text-2xl" style={stagger(1)}>
                    {step.title}
                  </h3>
                </div>
                <p className="v-rise mt-5 text-base leading-relaxed text-gp-mist" style={stagger(2)}>
                  {step.text}
                </p>
                {Scene && (
                  <div className="mt-6 flex min-h-[76px] flex-col justify-center rounded-2xl bg-gp-void/60 p-3.5 ring-1 ring-inset ring-gp-bone/10" aria-hidden="true">
                    <Scene />
                  </div>
                )}
              </div>
              {i < STEPS.length - 1 && (
                <span className="absolute -right-5 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 animate-pulse-soft items-center justify-center rounded-full bg-gp-raised text-gp-mint ring-1 ring-gp-bone/10 md:flex" aria-hidden="true">
                  <FiArrowRight className="h-4 w-4" />
                </span>
              )}
            </Reveal>
            );
          })}
        </ol>

        <Reveal delay={420} className="mt-10 flex justify-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-gp-edge-2 bg-gp-bone/5 px-4 py-2 text-center text-sm text-gp-mist">
            <FiCheckCircle className="h-4 w-4 shrink-0 text-gp-mint" /> {HOW_IT_WORKS.note}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

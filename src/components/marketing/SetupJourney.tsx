import type { CSSProperties } from "react";
import { FiCheck, FiCheckCircle, FiUserPlus } from "react-icons/fi";
import { HOW_IT_WORKS, SETUP_JOURNEY } from "@/content/site";
import { stagger } from "@/lib/motion";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import Glow from "./Glow";

// "What you get" and "How it works" as one story (the owner's call): three
// cards, each one step and what the gym has once it is done. 1: we set up
// the system behind the desk (website, member portal and admin area tick
// off); 2: the gym's own website, on its own address; 3: the member portal,
// then the first member and the first payment. On wide
// screens a line joins the steps and a pulse runs along it; each card's scene
// builds as the pulse reaches it (globals.css). Still under reduced motion.

const TINTS = ["from-gp-mint to-gp-mint/60", "from-gp-ember to-gp-ember/60", "from-gp-violet to-gp-blue"];
const LOOP = 6;
const ARRIVAL = [0.8, 2.4, 4.0];
const at = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` });

// 1. The system behind the desk: bars grow and the day's rows fill in.
function DeskScene() {
  return (
    <div className="flex h-full items-end gap-3 px-4 pb-3 pt-4">
      <div className="flex h-full flex-1 items-end gap-1.5">
        {[0.55, 0.8, 0.45, 1, 0.7].map((h, i) => (
          <span key={i} className="a-wyg-bar w-full rounded-t bg-gradient-to-t from-gp-mint/60 to-gp-mint" style={{ height: `${h * 100}%`, ...at(ARRIVAL[0] + i * 0.15) }} />
        ))}
      </div>
      <div className="flex w-[46%] flex-col gap-1.5 self-center">
        {["Fee paid", "Checked in", "Class booked"].map((row, i) => (
          <span key={row} className="a-wyg-build flex items-center gap-1.5 rounded-md bg-gp-panel px-2 py-1 text-left text-[10px] font-medium text-gp-mist shadow-sm ring-1 ring-gp-bone/10" style={at(ARRIVAL[0] + 0.3 + i * 0.35)}>
            <span className="inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-gp-mint text-gp-ink">
              <FiCheck className="h-2 w-2" />
            </span>
            {row}
          </span>
        ))}
      </div>
    </div>
  );
}

// The three parts of the setup tick off as it finishes.
function SetupChips() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {["Website", "Member portal", "Admin area"].map((part, i) => (
        <span key={part} className="a-wyg-build inline-flex items-center gap-1 rounded-full bg-gp-mint/15 px-2.5 py-1 text-[11px] font-medium text-gp-mint ring-1 ring-inset ring-gp-mint/30" style={at(ARRIVAL[0] + 1.3 + i * 0.3)}>
          <FiCheck className="h-3 w-3" /> {part}
        </span>
      ))}
    </div>
  );
}

// 2. The gym's own website: the address types itself, the padlock turns
// green and the page builds block by block.
function WebsiteScene() {
  const t = ARRIVAL[1];
  return (
    <div className="mx-3 mt-3 overflow-hidden rounded-lg bg-gp-panel text-left shadow-sm ring-1 ring-gp-bone/10">
      <div className="flex items-center gap-1 border-b border-gp-edge px-2 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
        <span className="h-1.5 w-1.5 rounded-full bg-gp-ember" />
        <span className="h-1.5 w-1.5 rounded-full bg-gp-mint" />
        <span className="ml-1.5 flex flex-1 items-center rounded bg-gp-bone/5 px-1.5 py-0.5 font-mono text-[9px] text-gp-slate">
          <span className="a-wyg-type inline-block overflow-hidden whitespace-nowrap" style={at(t - 0.6)}>yourgym.com</span>
          <span className="a-blink ml-px inline-block h-2.5 w-px bg-gp-slate" />
        </span>
        <span className="a-wyg-tick ml-1 rounded-full bg-gp-mint px-1.5 py-px text-[8px] font-bold text-gp-ink" style={at(t + 0.9)}>
          Connected
        </span>
      </div>
      <div className="space-y-1.5 p-2">
        <span className="a-wyg-build block h-2 w-1/3 rounded bg-gradient-to-r from-gp-ember to-gp-ember/60" style={at(t)} />
        <span className="a-wyg-build block h-6 rounded bg-gradient-to-r from-gp-ember/20 to-gp-ember/5" style={at(t + 0.3)} />
        <span className="a-wyg-build flex gap-1.5" style={at(t + 0.6)}>
          <span className="h-3 w-12 rounded-full bg-gp-ember" />
          <span className="h-3 w-9 rounded-full bg-gp-bone/10" />
        </span>
      </div>
    </div>
  );
}

// 3. The member portal: Book, Pay and Check in light up in turn on a phone,
// and the first payment lands beside it.
function PortalScene() {
  const t = ARRIVAL[2];
  return (
    <div className="flex h-full items-center justify-center gap-3 px-3">
      <div className="relative h-[104px] w-[84px] shrink-0 rounded-[14px] border-[3px] border-gp-bone/80 bg-gp-panel p-1.5 shadow-sm">
        <span className="mx-auto mb-1.5 block h-1 w-6 rounded-full bg-gp-bone/80" />
        {["Book", "Pay", "Check in"].map((label, i) => (
          <span key={label} className="a-wyg-row mb-1 block rounded-md bg-gp-bone/5 py-1 text-center text-[9px] font-semibold text-gp-mist" style={at(t + i * 0.3)}>
            {label}
          </span>
        ))}
        <span className="a-wyg-tick absolute -right-2.5 -top-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gp-violet to-gp-blue text-gp-ink shadow-lg" style={at(t + 1)}>
          <FiCheck className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="a-bn-slide flex items-center gap-1.5 rounded-lg bg-gp-panel px-2 py-1.5 text-left text-[10px] text-gp-bone shadow-sm ring-1 ring-gp-bone/10" style={at(t + 1.1)}>
          <FiUserPlus className="h-3 w-3 shrink-0 text-gp-ember" /> New member joined
        </span>
        <span className="a-bn-slide flex items-center justify-between gap-1.5 rounded-lg bg-gp-panel px-2 py-1.5 text-left text-[10px] text-gp-bone shadow-sm ring-1 ring-gp-bone/10" style={at(t + 1.6)}>
          <span className="inline-flex items-center gap-1.5">
            <FiCheckCircle className="h-3 w-3 shrink-0 text-gp-mint" /> Payment received
          </span>
          <span className="font-semibold text-gp-mint">Rs 4,900</span>
        </span>
      </div>
    </div>
  );
}

const SCENES = [DeskScene, WebsiteScene, PortalScene];

export default function SetupJourney() {
  return (
    <section id="how-it-works" className="relative overflow-hidden border-y border-gp-edge bg-gp-graphite py-20 sm:py-24">
      <div className="bg-grid-dark absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" aria-hidden="true" />
      <Glow className="left-1/2 top-1/2 h-[680px] w-[1100px] -translate-x-1/2 -translate-y-1/2" color="rgb(var(--gp-mint) / 0.10)" drift="a" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading eyebrow={HOW_IT_WORKS.eyebrow} title={HOW_IT_WORKS.title} text="Three steps, and we do the technical part. At the end you have one setup under your gym's name: the system behind your desk, your own website and a member portal." />

        {/* The line that joins the steps: a numbered node over each card. */}
        <Reveal className="relative mx-auto mt-12 hidden h-12 md:block">
          <div aria-hidden="true" className="absolute inset-x-[16.66%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-gp-bone/10">
            <span className="v-fill absolute inset-0 origin-left rounded-full bg-gradient-to-r from-gp-mint via-gp-ember to-gp-violet" style={stagger(1)} />
            <span className="a-wyg-flow absolute top-1/2 h-3 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gp-bone/90 blur-[3px]" style={{ animationDuration: `${LOOP}s` }} />
          </div>
          {SETUP_JOURNEY.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`a-wyg-node absolute top-1/2 inline-flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-gradient-to-br ${TINTS[i]} font-gp text-lg font-bold text-gp-ink shadow-lg`}
              style={{ left: `${16.66 + i * 33.34}%`, ...at(ARRIVAL[i]) }}
            >
              {i + 1}
            </span>
          ))}
        </Reveal>

        <ol className="mt-5 grid gap-5 md:mt-6 md:grid-cols-3">
          {SETUP_JOURNEY.map((step, i) => {
            const Scene = SCENES[i];
            return (
              <Reveal key={step.title} delay={i * 110} as="li">
                <div className="flex h-full flex-col rounded-2xl border border-gp-edge-2 bg-gp-panel p-6 shadow-card">
                  <div className="flex items-center gap-3">
                    {/* On phones the line is hidden, so each card shows its number. */}
                    <span className={`v-pop inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${TINTS[i]} font-gp text-base font-bold text-gp-ink shadow-lg md:hidden`} style={stagger(0)}>
                      {i + 1}
                    </span>
                    <h3 className="v-rise font-gp text-xl font-semibold leading-tight tracking-tight text-gp-bone" style={stagger(1)}>
                      {step.title}
                    </h3>
                  </div>
                  <p className="v-rise mt-3 text-[15px] leading-relaxed text-gp-mist" style={stagger(2)}>
                    {step.text}
                  </p>
                  {i === 0 && (
                    <div className="mt-3" aria-hidden="true">
                      <SetupChips />
                    </div>
                  )}
                  <div className="mt-auto space-y-3 pt-6" aria-hidden="true">
                    <div className="h-28 rounded-xl bg-gp-void ring-1 ring-inset ring-gp-bone/5">
                      <Scene />
                    </div>
                  </div>
                </div>
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

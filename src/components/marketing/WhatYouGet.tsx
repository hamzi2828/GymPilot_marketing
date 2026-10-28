import type { CSSProperties } from "react";
import { FiCheck, FiGlobe, FiSettings, FiSmartphone } from "react-icons/fi";
import { WHAT_YOU_GET } from "@/content/site";
import { stagger } from "@/lib/motion";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const ICONS = [FiSettings, FiGlobe, FiSmartphone];
const TINTS = ["from-gp-mint to-gp-mint/60", "from-gp-ember to-gp-ember/60", "from-gp-violet to-gp-blue"];

// One loop of the whole section, in seconds: the pulse runs along the line
// and each part builds itself as the pulse reaches it (globals.css, "What
// you get"). The delays below put each part on the pulse's arrival.
const LOOP = 6;
const ARRIVAL = [0.8, 2.4, 4.0];
const at = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` });

// The system behind the desk: a little dashboard whose bars grow and whose
// rows fill in.
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

// Your own website: the address types itself and the page builds block by
// block, in the website's own (orange) tint.
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

// The member portal: on a phone, Book, Pay and Check in light up in turn,
// and a tick says it all went through.
function PortalScene() {
  const t = ARRIVAL[2];
  return (
    <div className="relative mx-auto mt-2 h-[104px] w-[84px] rounded-[14px] border-[3px] border-gp-bone/80 bg-gp-panel p-1.5 shadow-sm">
      <span className="mx-auto mb-1.5 block h-1 w-6 rounded-full bg-gp-bone/80" />
      {["Book", "Pay", "Check in"].map((label, i) => (
        <span key={label} className="a-wyg-row mb-1 block rounded-md bg-gp-bone/5 py-1 text-[9px] font-semibold text-gp-mist" style={at(t + i * 0.3)}>
          {label}
        </span>
      ))}
      <span className="a-wyg-tick absolute -right-2.5 -top-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gp-violet to-gp-blue text-gp-ink shadow-lg" style={at(t + 1)}>
        <FiCheck className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

const SCENES = [DeskScene, WebsiteScene, PortalScene];

// What the gym actually receives, in three lines: the system behind the desk,
// its own website and the member portal, set up together. On wide screens a
// line joins them and a pulse runs along it, so the three are seen to be one
// setup coming together; each card's scene builds as the pulse arrives.
export default function WhatYouGet() {
  return (
    <section id="included" className="relative overflow-hidden border-y border-gp-edge bg-gp-graphite py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading eyebrow={WHAT_YOU_GET.eyebrow} title={WHAT_YOU_GET.title} text={WHAT_YOU_GET.text} />

        {/* The line that joins the three: a node over each card's centre. */}
        <Reveal className="relative mx-auto mt-12 hidden h-12 md:block">
          <div aria-hidden="true" className="absolute inset-x-[16.66%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-gp-bone/10">
            <span className="v-fill absolute inset-0 origin-left rounded-full bg-gradient-to-r from-gp-mint via-gp-ember to-gp-violet" style={stagger(1)} />
            <span className="a-wyg-flow absolute top-1/2 h-3 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gp-bone/90 blur-[3px]" style={{ animationDuration: `${LOOP}s` }} />
          </div>
          {ICONS.map((Icon, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`a-wyg-node absolute top-1/2 inline-flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-gradient-to-br ${TINTS[i]} text-gp-ink shadow-lg`}
              style={{ left: `${16.66 + i * 33.34}%`, ...at(ARRIVAL[i]) }}
            >
              <Icon className="h-5 w-5" />
            </span>
          ))}
        </Reveal>

        <ul className="mt-5 grid gap-5 md:mt-6 md:grid-cols-3">
          {WHAT_YOU_GET.parts.map((part, i) => {
            const Icon = ICONS[i];
            const Scene = SCENES[i];
            return (
              <Reveal key={part.title} delay={i * 110} as="li">
                <div className="h-full rounded-2xl border border-gp-edge-2 bg-gp-panel p-6 text-center shadow-card">
                  {/* On phones the line is not shown, so each card keeps its icon. */}
                  <span className={`v-pop inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${TINTS[i]} text-gp-ink shadow-lg md:hidden`} style={stagger(0)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="mt-4 h-28 rounded-xl bg-gp-void ring-1 ring-inset ring-gp-bone/5 md:mt-0" aria-hidden="true">
                    <Scene />
                  </div>
                  <h3 className="v-rise mt-5 font-gp text-xl font-semibold tracking-tight text-gp-bone" style={stagger(1)}>
                    {part.title}
                  </h3>
                  <p className="v-rise mt-2 text-base leading-relaxed text-gp-mist" style={stagger(2)}>
                    {part.text}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

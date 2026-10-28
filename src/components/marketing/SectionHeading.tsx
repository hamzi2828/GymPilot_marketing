import { stagger } from "@/lib/motion";
import Reveal from "./Reveal";

export default function SectionHeading({ eyebrow, title, text, align = "center" }: { eyebrow: string; title: string; text?: string; /** Kept for callers: every section now shares the themed look. */ dark?: boolean; align?: "center" | "left" }) {
  const centered = align === "center";
  return (
    <Reveal className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="v-rise text-xs font-semibold uppercase tracking-[0.18em] text-gp-mint" style={stagger(0)}>
        {eyebrow}
      </p>
      <h2 className="v-rise mt-3 font-gp text-3xl font-semibold tracking-[-0.02em] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1] gp-shine" style={stagger(1)}>
        {title}
      </h2>
      <span className={`v-fill mt-4 block h-1 w-12 rounded-full bg-gradient-to-r from-gp-mint to-gp-ember ${centered ? "mx-auto origin-center" : "origin-left"}`} style={stagger(2)} aria-hidden="true" />
      {text && (
        <p className="v-rise mt-4 text-base leading-relaxed text-gp-mist sm:text-lg" style={stagger(3)}>
          {text}
        </p>
      )}
    </Reveal>
  );
}

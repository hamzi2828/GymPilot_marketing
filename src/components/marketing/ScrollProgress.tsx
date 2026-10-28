"use client";

// A round "back to top" button, bottom right, whose ring fills as the
// visitor scrolls down the page. Hidden until they have scrolled a little.

import { useEffect, useState } from "react";
import { FiArrowUp } from "react-icons/fi";

const SIZE = 52;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const visible = progress > 0.04;
  const percent = Math.round(progress * 100);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={`Back to top (${percent}% scrolled)`}
      title={`${percent}% of the page`}
      className={`group fixed bottom-6 right-6 z-40 flex items-center justify-center rounded-full bg-gp-panel font-gp text-gp-bone shadow-[0_20px_50px_-20px_rgb(var(--gp-void)/0.9)] [html[data-gp-theme=light]_&]:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.3)] ring-1 ring-gp-edge-2 transition-all duration-300 hover:bg-gp-raised ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
      style={{ width: SIZE, height: SIZE }}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" style={{ stroke: "var(--gp-edge)" }} strokeWidth={STROKE} />
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="url(#scroll-ring)" strokeWidth={STROKE} strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - progress)} style={{ transition: "stroke-dashoffset 120ms linear" }} />
        <defs>
          <linearGradient id="scroll-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "rgb(var(--gp-mint))" }} />
            <stop offset="1" style={{ stopColor: "rgb(var(--gp-ember))" }} />
          </linearGradient>
        </defs>
      </svg>
      <span className="relative flex flex-col items-center leading-none">
        <FiArrowUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
        <span className="mt-0.5 text-[9px] font-medium tabular-nums text-gp-mist">{percent}%</span>
      </span>
    </button>
  );
}

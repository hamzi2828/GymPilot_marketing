"use client";

// The giant "gymspilot" along the bottom of the footer (from the reference):
// while the pointer is over the footer, the letters near it lift and light up
// in a mint-to-amber spotlight that follows the pointer. Reduced motion keeps
// the light but not the lift.

import { useEffect, useRef } from "react";
import s from "./FooterWordmark.module.css";

const WORD = "gymspilot";

export default function FooterWordmark() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const giant = box.current;
    const foot = giant?.closest("footer");
    if (!giant || !foot) return;
    const letters = Array.from(giant.querySelectorAll<HTMLElement>(`.${s.gl}`));
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let px = 0;
    let py = 0;

    const update = () => {
      raf = 0;
      const width = giant.getBoundingClientRect().width || 1;
      for (const g of letters) {
        const b = g.getBoundingClientRect();
        g.style.setProperty("--lx", `${px - b.left}px`);
        g.style.setProperty("--ly", `${py - b.top}px`);
        if (!still.matches) {
          const d = Math.abs(px - (b.left + b.width / 2)) / width;
          g.style.transform = `translateY(${-Math.max(0, 1 - d * 5) * 9}%)`;
        }
      }
    };
    const move = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      giant.classList.add(s.lit);
      if (!raf) raf = requestAnimationFrame(update);
    };
    const leave = () => {
      giant.classList.remove(s.lit);
      letters.forEach((g) => (g.style.transform = ""));
    };

    foot.addEventListener("pointermove", move);
    foot.addEventListener("pointerleave", leave);
    return () => {
      foot.removeEventListener("pointermove", move);
      foot.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={box} className={`${s.giant} mt-10 translate-y-[12%] select-none whitespace-nowrap text-center font-gp-brand text-[15.5vw] font-semibold leading-[0.8] tracking-[-0.03em]`} aria-hidden="true">
      {Array.from(WORD).map((c, i) => (
        <span key={i} className={s.gl} data-c={c}>
          {c}
        </span>
      ))}
    </div>
  );
}

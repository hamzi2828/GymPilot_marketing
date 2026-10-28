"use client";

// The first-load logo intro from the reference (source/intro), without its
// video: a mint-to-amber seam draws across the screen, the G builds from its
// three blocks, "gymspılot" rises letter by letter, the dot drops onto the i
// and PRO pops in, then the overlay fades to the page underneath.
//
// It renders nothing on the server or on the first client render, so the page
// (and its LCP) is untouched and hydration matches; the overlay is fixed, so
// nothing shifts. Plays on every full page load (reload included, like the
// reference) but not again when the visitor clicks back to the homepage
// within the site; never under reduced motion;
// a click, tap, key press or scroll skips it (onClick, so the click that
// skips it is not also passed to a link underneath).

import { useCallback, useEffect, useRef, useState } from "react";
import { GMark } from "./Brand";
import s from "./LogoIntro.module.css";

// Module state survives client-side navigation but resets on a full reload.
let playedThisLoad = false;
const HOLD_MS = 2150; // the entrance finishes at about 2s; then the fade
const FADE_MS = 500;
const WORD = ["g", "y", "m", "s", "p", "ı", "l", "o", "t"];

export default function LogoIntro() {
  const [phase, setPhase] = useState<"off" | "on" | "out">("off");
  const timer = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (playedThisLoad) return;
    playedThisLoad = true;
    setPhase("on");
  }, []);

  const leave = useCallback(() => {
    setPhase((p) => (p === "on" ? "out" : p));
  }, []);

  useEffect(() => {
    if (phase === "on") {
      timer.current = window.setTimeout(leave, HOLD_MS);
      const opts = { passive: true } as const;
      window.addEventListener("keydown", leave);
      window.addEventListener("wheel", leave, opts);
      window.addEventListener("touchmove", leave, opts);
      return () => {
        clearTimeout(timer.current);
        window.removeEventListener("keydown", leave);
        window.removeEventListener("wheel", leave);
        window.removeEventListener("touchmove", leave);
      };
    }
    if (phase === "out") {
      timer.current = window.setTimeout(() => setPhase("off"), FADE_MS + 50);
      return () => clearTimeout(timer.current);
    }
  }, [phase, leave]);

  if (phase === "off") return null;

  return (
    <div className={`${s.intro} ${phase === "out" ? s.out : ""}`} style={{ transitionDuration: `${FADE_MS}ms` }} aria-hidden="true" onClick={leave}>
      <span className={s.seam} />
      <span className={`gp-logo ${s.logo}`}>
        <span className={s.mark}>
          <GMark />
          <span className={s.glow} />
        </span>
        <span className={s.word}>
          {WORD.map((c, i) => (
            <span key={i} className={`${s.ch} ${c === "ı" ? `i ${s.i}` : ""}`} style={{ animationDelay: `${0.95 + i * 0.035}s` }}>
              {c}
            </span>
          ))}
        </span>
        <span className={`pro ${s.pro}`}>PRO</span>
      </span>
    </div>
  );
}

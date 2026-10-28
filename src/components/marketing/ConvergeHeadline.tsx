"use client";

// "Your whole gym in one system": the reference design's converge section.
// The section is tall with a sticky stage; as it scrolls past, the scattered
// letters and icon tiles gather into place. Transforms are written straight
// onto the elements from a requestAnimationFrame callback (no re-render per
// frame). Without JavaScript, or with reduced motion, the assembled state
// shows and (reduced motion) the section is normal height.

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { IconType } from "react-icons";
import {
  LuBanknote,
  LuCalendarCheck,
  LuChartLine,
  LuFingerprint,
  LuGlobe,
  LuMessageCircle,
  LuPrinter,
  LuShoppingBag,
  LuUsers,
} from "react-icons/lu";
import styles from "./ConvergeHeadline.module.css";

const WORD = "Your whole gym in one system";
const CHARS = [...WORD];

// Soft accents as the reference uses them; the stylesheet mixes them with
// white/black for the light theme, so they stay literal here.
const ICONS: { Icon: IconType; color: string }[] = [
  { Icon: LuBanknote, color: "#7FE3D2" },
  { Icon: LuFingerprint, color: "#E5A34A" },
  { Icon: LuCalendarCheck, color: "#6FA8FF" },
  { Icon: LuUsers, color: "#7FE3D2" },
  { Icon: LuChartLine, color: "#A98BFF" },
  { Icon: LuShoppingBag, color: "#E5A34A" },
  { Icon: LuPrinter, color: "#7FE3D2" },
  { Icon: LuGlobe, color: "#6FA8FF" },
  { Icon: LuMessageCircle, color: "#E5A34A" },
];

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

const BRACE_PATH =
  "M26.52 77.21h-5.75c-6.83 0-12.38-5.56-12.38-12.38V48.38C8.39 43.76 4.63 40 .01 40v-4c4.62 0 8.38-3.76 8.38-8.38V12.4C8.38 5.56 13.94 0 20.77 0h5.75v4h-5.75c-4.62 0-8.38 3.76-8.38 8.38V27.6c0 4.34-2.25 8.17-5.64 10.380 3.39 2.21 5.64 6.04 5.64 10.38v16.45c0 4.62 3.76 8.38 8.38 8.38h5.75v4.02Z";

function Brace() {
  return (
    <svg className={styles.brace} viewBox="0 0 27 78" aria-hidden="true" focusable="false">
      <path fill="currentColor" d={BRACE_PATH} />
    </svg>
  );
}

export default function ConvergeHeadline() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const iconRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const mq = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    let raf = 0;

    const reset = () => {
      for (const el of [...charRefs.current, ...iconRefs.current]) {
        if (!el) continue;
        el.style.transform = "";
        el.style.opacity = "";
      }
    };

    // Same maths as the reference's convFrame().
    const frame = () => {
      raf = 0;
      if (mq?.matches) return;
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -50 || r.top > vh + 50) return;
      const p = clamp(-r.top / Math.max(1, r.height - vh));
      const mob = window.innerWidth < 640;

      const chars = charRefs.current;
      const t = ease(clamp(p / 0.42));
      const cc = (chars.length - 1) / 2;
      chars.forEach((c, i) => {
        if (!c) return;
        const d = i - cc;
        c.style.transform = `translate3d(${d * (mob ? 14 : 46) * (1 - t)}px,0,0) rotateX(${d * 38 * (1 - t)}deg)`;
        c.style.opacity = (0.15 + 0.85 * t).toFixed(3);
      });

      const icons = iconRefs.current;
      const t2 = ease(clamp((p - 0.3) / 0.45));
      const ic = (icons.length - 1) / 2;
      icons.forEach((c, i) => {
        if (!c) return;
        const d = i - ic;
        c.style.transform = `translate3d(${d * (mob ? 30 : 90) * (1 - t2)}px,${-Math.abs(d) * 22 * (1 - t2)}px,0) rotate(${d * 28 * (1 - t2)}deg) scale(${0.72 + 0.28 * t2})`;
        c.style.opacity = (0.1 + 0.9 * t2).toFixed(3);
      });
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onMotionPref = () => {
      if (mq?.matches) reset();
      else kick();
    };

    frame();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    mq?.addEventListener?.("change", onMotionPref);
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      mq?.removeEventListener?.("change", onMotionPref);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} className={`${styles.conv} font-gp`} aria-label={WORD}>
      <div className={styles.stick}>
        <div className={styles.inner}>
          <h2 className="sr-only">{WORD}</h2>
          <div className={styles.word} aria-hidden="true">
            {CHARS.map((c, i) =>
              c === " " ? (
                <span key={i}>
                  <span
                    ref={(el) => {
                      charRefs.current[i] = el;
                    }}
                    className={styles.sp}
                  >
                    {" "}
                  </span>
                  <wbr />
                </span>
              ) : (
                <span
                  key={i}
                  ref={(el) => {
                    charRefs.current[i] = el;
                  }}
                  className={styles.ch}
                >
                  {c}
                </span>
              ),
            )}
          </div>
          <p className={styles.cap}>
            <Brace />
            <span>every desk job, connected</span>
            <span className={styles.braceFlip}>
              <Brace />
            </span>
          </p>
          <div className={styles.icons} aria-hidden="true">
            {ICONS.map(({ Icon, color }, i) => (
              <span
                key={i}
                ref={(el) => {
                  iconRefs.current[i] = el;
                }}
                className={styles.tile}
                style={{ "--c": color } as CSSProperties}
              >
                <Icon />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

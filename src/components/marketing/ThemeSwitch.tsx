"use client";

// The reference's barbell switch between the dark (default) and light site.
// The theme lives on <html data-gp-theme="light">, set before paint by
// layout.tsx from localStorage "gp-theme"; every switch on the page reads it
// from there, so two of them (the bar and the phone menu) always agree.
// Where the browser has view transitions, the new theme rolls out from the
// switch behind a weight-plate rim; otherwise, or for anyone who has asked
// for reduced motion, it simply changes.

import { useSyncExternalStore } from "react";
import styles from "./ThemeSwitch.module.css";

const KEY = "gp-theme";
const DURATION = 980;

const isLight = () => document.documentElement.getAttribute("data-gp-theme") === "light";

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-gp-theme"] });
  return () => mo.disconnect();
}

/** Whether the site is in light mode; dark on the server and during hydration. */
export function useLightTheme() {
  return useSyncExternalStore(subscribe, isLight, () => false);
}

function paint(light: boolean) {
  document.documentElement.setAttribute("data-gp-theme", light ? "light" : "dark");
  try {
    localStorage.setItem(KEY, light ? "light" : "dark");
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
  window.dispatchEvent(new CustomEvent("gp-theme", { detail: { light } }));
}

type ViewTransitionLike = { ready: Promise<void>; finished: Promise<void>; skipTransition: () => void };
type DocWithVT = Document & { startViewTransition?: (cb: () => void) => ViewTransitionLike };

let running: ViewTransitionLike | null = null;

function setTheme(light: boolean, from: HTMLElement) {
  if (light === isLight()) return;
  if (running) {
    try {
      running.skipTransition();
    } catch {
      // Already over.
    }
    running = null;
  }
  document.querySelectorAll(`.${styles.plateOv}`).forEach((n) => n.remove());

  const doc = document as DocWithVT;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || still) {
    paint(light);
    return;
  }

  const root = document.documentElement;
  const r = from.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 40;
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const ov = document.createElement("div");
  ov.className = styles.plateOv;
  ov.setAttribute("aria-hidden", "true");
  ov.innerHTML = `<svg width="100%" height="100%"><g transform="translate(${x} ${y})"><circle class="${styles.p1}" r="0"/><circle class="${styles.p2}" r="0"/><circle class="${styles.p3}" r="0"/></g></svg>`;
  const circles = Array.from(ov.querySelectorAll("circle"));

  // globals.css turns off the browser's own cross-fade while this class is on.
  root.classList.add("gp-plate-vt");
  let vt: ViewTransitionLike;
  try {
    vt = doc.startViewTransition(() => {
      paint(light);
      document.body.appendChild(ov);
    });
  } catch {
    root.classList.remove("gp-plate-vt");
    paint(light);
    return;
  }
  running = vt;
  const done = () => {
    ov.remove();
    if (running === vt) {
      running = null;
      root.classList.remove("gp-plate-vt");
    }
  };

  vt.ready
    .then(() => {
      const o: KeyframeAnimationOptions = { duration: DURATION, easing: "linear", fill: "forwards" };
      const anims = [
        root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] }, { ...o, pseudoElement: "::view-transition-new(root)" }),
        root.animate(
          { transform: ["scale(1)", "scale(.965)"], filter: ["brightness(1)", "brightness(.82)"], transformOrigin: [`${x}px ${y}px`, `${x}px ${y}px`] },
          { ...o, pseudoElement: "::view-transition-old(root)" }
        ),
      ];
      anims.forEach((a) => a.pause());
      const t0 = performance.now();
      const tick = (now: number) => {
        if (running !== vt) return;
        const t = Math.min(1, (now - t0) / DURATION);
        const e = ease(t);
        const rr = R * e;
        anims.forEach((a) => (a.currentTime = e * DURATION));
        circles[0].setAttribute("r", String(Math.max(0, rr)));
        circles[1].setAttribute("r", String(Math.max(0, rr - 9)));
        circles[2].setAttribute("r", String(Math.max(0, rr - 22)));
        circles[2].style.transform = `rotate(${e * 160}deg)`;
        ov.style.opacity = t > 0.82 ? String(1 - (t - 0.82) / 0.18) : "1";
        if (t < 1) requestAnimationFrame(tick);
        else anims.forEach((a) => a.finish());
      };
      requestAnimationFrame(tick);
    })
    .catch(done);
  vt.finished.then(done, done);
  setTimeout(done, DURATION + 900);
}

export default function ThemeSwitch({ className = "" }: { className?: string }) {
  const light = useLightTheme();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={light}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      title={light ? "Dark mode" : "Light mode"}
      onClick={(e) => setTheme(!isLight(), e.currentTarget)}
      className={`${styles.tg} ${className}`}
    >
      <span className={styles.rod} aria-hidden="true" />
      <span className={`${styles.col} ${styles.colL}`} aria-hidden="true" />
      <span className={`${styles.col} ${styles.colR}`} aria-hidden="true" />
      <span className={styles.pl} aria-hidden="true" />
    </button>
  );
}

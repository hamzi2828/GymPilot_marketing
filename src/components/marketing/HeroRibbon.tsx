"use client";

// The hero's glowing ribbon, after the reference: a line of short slanted
// strokes rising into a hill under the cursor, with a few mint and amber
// lights travelling along it. One small canvas; it only animates while on
// screen and the tab is visible, and holds still (one frame) for anyone who
// has asked for reduced motion. Its colours are the theme tokens (--gp-*),
// read again whenever <html data-gp-theme> changes.

import { useEffect, useRef } from "react";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

type RGB = [number, number, number];
type Tone = "mint" | "ember" | "warm";
type Light = { p: number; v: number; tone: Tone; c: RGB; cube: boolean };

/** A theme token ("--gp-mint" is "127 227 210") as numbers. */
const token = (styles: CSSStyleDeclaration, name: string, fallback: RGB): RGB => {
  const parts = styles.getPropertyValue(name).trim().split(/[\s,]+/).map(Number);
  return parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n)) ? [parts[0], parts[1], parts[2]] : fallback;
};
const mix = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

export default function HeroRibbon({ className = "" }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = wrap.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!box || !cv || !ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lights: Light[] = [
      { p: -0.05, v: 0.055, tone: "mint", c: [127, 227, 210], cube: true },
      { p: 0.32, v: 0.04, tone: "ember", c: [229, 163, 74], cube: true },
      { p: 0.62, v: 0.05, tone: "mint", c: [127, 227, 210], cube: true },
      { p: 0.9, v: 0.035, tone: "warm", c: [255, 236, 210], cube: false },
      { p: 0.15, v: 0.03, tone: "ember", c: [229, 163, 74], cube: false },
    ];
    // The theme's colours: the strokes, the crest, the lights.
    let light = false;
    let base: RGB = [124, 129, 127];
    let crest: RGB = [242, 243, 241];
    let mint: RGB = [127, 227, 210];
    const readTheme = () => {
      const root = document.documentElement;
      const cs = getComputedStyle(root);
      light = root.getAttribute("data-gp-theme") === "light";
      base = token(cs, "--gp-slate", base);
      crest = token(cs, "--gp-bone", crest);
      mint = token(cs, "--gp-mint", mint);
      const ember = token(cs, "--gp-ember", [229, 163, 74]);
      const warm = mix(ember, token(cs, "--gp-paper", [238, 239, 236]), 0.55);
      for (const l of lights) l.c = l.tone === "mint" ? mint : l.tone === "ember" ? ember : warm;
    };
    readTheme();
    let W = 0;
    let H = 0;
    let mx = 0.56;
    let tmx = 0.56;
    let t = 0;
    let last = 0;
    let raf = 0;
    let onScreen = true;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = box.clientWidth;
      H = box.clientHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const at = (u: number): [number, number, number, number] => {
      const x = -0.06 * W + u * 1.12 * W;
      const hill = Math.exp(-Math.pow((u - mx) / 0.2, 2));
      const wave = Math.sin(u * 6.5 + t * 0.5) * 0.07 * (1 - hill * 0.6) + Math.sin(u * 13 - t * 0.8) * 0.012;
      const y = H * 0.78 - hill * H * 0.42 - wave * H;
      const d = (3 + 28 * Math.pow(Math.max(0, Math.sin(Math.PI * clamp(u, 0, 1))), 1.4)) * clamp(W / 1200, 0.55, 1.2);
      return [x, y, d, hill];
    };

    const draw = (dt: number) => {
      t += dt;
      mx += (tmx - mx) * 0.035;
      ctx.clearRect(0, 0, W, H);
      for (const l of lights) {
        l.p += l.v * dt;
        if (l.p > 1.12) l.p = -0.12;
      }

      // the strokes
      const n = Math.round(W / 3.6);
      ctx.lineWidth = 1.1;
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const [x, y, d, h] = at(u);
        const edge = Math.pow(Math.sin(Math.PI * u), 0.7);
        let [r, g, b] = base;
        let gl = 0;
        let cr = 0;
        let cg = 0;
        let cb = 0;
        for (const l of lights) {
          const k = Math.exp(-Math.pow((u - l.p) / 0.045, 2));
          gl += k;
          cr += l.c[0] * k;
          cg += l.c[1] * k;
          cb += l.c[2] * k;
        }
        if (gl > 0) {
          const m = Math.min(1, gl);
          r = r * (1 - m) + (cr / gl) * m;
          g = g * (1 - m) + (cg / gl) * m;
          b = b * (1 - m) + (cb / gl) * m;
        }
        ctx.strokeStyle = `rgba(${r | 0},${g | 0},${b | 0},${(0.08 + 0.32 * h + 0.6 * Math.min(1, gl)) * edge})`;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - d * 0.55, y + d);
        ctx.stroke();
      }

      // the bright crest line
      const px = clamp((-0.06 * W + mx * 1.12 * W) / W, 0, 1);
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, `rgba(${crest},0)`);
      grad.addColorStop(clamp(px - 0.25, 0, 1), `rgba(${base},.3)`);
      grad.addColorStop(px, `rgba(${crest},${light ? 0.8 : 0.95})`);
      grad.addColorStop(clamp(px + 0.25, 0, 1), `rgba(${base},.3)`);
      grad.addColorStop(1, `rgba(${crest},0)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.shadowColor = light ? `rgba(${mint},.35)` : `rgba(${crest},.6)`;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const [x, y] = at(i / 120);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // the travelling lights
      // Light adds up on the dark page; on the light one it would vanish.
      ctx.globalCompositeOperation = light ? "source-over" : "lighter";
      for (const l of lights) {
        if (l.p < -0.05 || l.p > 1.05) continue;
        const [x, y, d] = at(l.p);
        const e = Math.pow(Math.max(0, Math.sin(Math.PI * clamp(l.p, 0, 1))), 0.8);
        const rg = ctx.createRadialGradient(x - d * 0.3, y + d * 0.6, 0, x - d * 0.3, y + d * 0.6, 110);
        rg.addColorStop(0, `rgba(${l.c},${0.38 * e})`);
        rg.addColorStop(1, `rgba(${l.c},0)`);
        ctx.fillStyle = rg;
        ctx.fillRect(x - 130, y - 120, 260, 260);
        if (l.cube) {
          ctx.shadowColor = `rgba(${l.c},1)`;
          ctx.shadowBlur = 22;
          ctx.fillStyle = `rgba(${l.c},${0.85 * e})`;
          const s = 9 * clamp(W / 1200, 0.7, 1.2);
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(x - s / 2 - d * 0.15, y - s * 0.9, s, s, 2.5);
          else ctx.rect(x - s / 2 - d * 0.15, y - s * 0.9, s, s);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const frame = (ts: number) => {
      raf = 0;
      const dt = Math.min(0.05, (ts - last) / 1000 || 0);
      last = ts;
      draw(dt);
      if (onScreen && !document.hidden) raf = window.requestAnimationFrame(frame);
    };
    const start = () => {
      if (still || raf || !onScreen || document.hidden) return;
      last = performance.now();
      raf = window.requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
    };

    size();
    draw(0);

    const onResize = () => {
      size();
      draw(0);
    };
    const host = box.parentElement ?? box;
    const onPointer = (e: PointerEvent) => {
      tmx = clamp(0.3 + 0.4 * (e.clientX / window.innerWidth), 0.3, 0.72);
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    io.observe(box);
    const themeWatch = new MutationObserver(() => {
      readTheme();
      draw(0);
    });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-gp-theme"] });
    window.addEventListener("resize", onResize);
    host.addEventListener("pointermove", onPointer);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      io.disconnect();
      themeWatch.disconnect();
      window.removeEventListener("resize", onResize);
      host.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={wrap} className={`relative ${className}`} aria-hidden="true">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

"use client";

// "Gym pulse": an interactive front-desk demo ported from the reference design
// (pulse.html / pulse.css / pulse.js). Everything here is sample data for a
// made-up gym. Server-rendered at its resting state, then counts in from zero
// the first time it scrolls into view (skipped with prefers-reduced-motion).

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  LuActivity,
  LuBellRing,
  LuCalendarCheck,
  LuChevronLeft,
  LuChevronRight,
  LuClock,
  LuMessageCircle,
  LuShieldCheck,
  LuUserPlus,
  LuUsers,
  LuWallet,
  LuWrench,
} from "react-icons/lu";
import { GMark } from "./Brand";
import s from "./GymPulse.module.css";

type Period = 7 | 30 | 365;

/* ---------------- helpers ---------------- */

const rs = (v: number) => (v >= 1e6 ? "Rs " + (v / 1e6).toFixed(2) + "M" : v >= 1e3 ? "Rs " + Math.round(v / 1e3) + "K" : "Rs " + Math.round(v));
const num = (v: number) => Math.round(v).toLocaleString("en-US");
const seed = (start: number) => {
  let x = start;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
};
function nice(x: number) {
  const m = Math.pow(10, Math.floor(Math.log10(x)));
  for (const k of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (k * m >= x) return k * m;
  return 10 * m;
}
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const END = () => new Date(2026, 9, 24);

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Tweens an array of numbers toward `target`. A change of `intro` replays from zero. */
function useTween(target: number[], { duration, ease, reduced, intro }: { duration: number; ease: (t: number) => number; reduced: boolean; intro: number }) {
  const [vals, setVals] = useState(target);
  const cur = useRef(target);
  const lastIntro = useRef(intro);
  const key = target.join(",");
  useEffect(() => {
    // lastIntro is only advanced once the replay finishes, so a cancelled run
    // (StrictMode, or a quick range change) still starts from zero.
    const replay = intro !== lastIntro.current;
    if (reduced) {
      lastIntro.current = intro;
      cur.current = target;
      setVals(target);
      return;
    }
    const from = !replay && cur.current.length === target.length ? cur.current.slice() : target.map(() => 0);
    if (from.every((v, i) => v === target[i])) {
      lastIntro.current = intro;
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const k = ease(t);
      const next = from.map((v, i) => v + (target[i] - v) * k);
      cur.current = next;
      setVals(next);
      if (t < 1) raf = requestAnimationFrame(tick);
      else lastIntro.current = intro;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, intro, reduced, duration]);
  return vals;
}
const power3 = (t: number) => 1 - Math.pow(1 - t, 3);
const expo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

function useWidth(ref: RefObject<Element | null>, fallback = 600) {
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setW(Math.max(1, Math.round(el.clientWidth || el.getBoundingClientRect().width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/* ---------------- sample data ---------------- */

const CAD: Record<Period, { pct: number; tag: string; run: string; conf: number; stats: [string, string][] }> = {
  7: { pct: 91, tag: "healthy", run: "22-day steady run", conf: 91, stats: [["2,184", "Check-ins"], ["7", "Open days"], ["68 min", "Average visit"], ["42", "Classes"]] },
  30: { pct: 88, tag: "healthy", run: "Busiest week since March", conf: 88, stats: [["9,310", "Check-ins"], ["30", "Open days"], ["66 min", "Average visit"], ["176", "Classes"]] },
  365: { pct: 84, tag: "steady", run: "Up 6% on last year", conf: 86, stats: [["112,480", "Check-ins"], ["358", "Open days"], ["64 min", "Average visit"], ["2,104", "Classes"]] },
};

type Heat = { cells: { x: number; y: number; lvl: number; v: number; label: string }[]; months: { x: number; t: string }[]; w: number; h: number };
function buildHeat(): Heat {
  const r = seed(91), W = 53, cs = 10, top = 4, left = 20;
  const end = END(), start = new Date(end);
  start.setDate(end.getDate() - (W * 7 - 1) - end.getDay() + 6);
  const dayW = [0.45, 1, 0.95, 0.9, 0.95, 0.8, 0.6];
  const cells: Heat["cells"] = [], months: Heat["months"] = [];
  let lastM = -1;
  for (let w = 0; w < W; w++)
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + w * 7 + d);
      if (dt > end) continue;
      const m = dt.getMonth(), season = m === 0 || m === 8 || m === 9 ? 1.12 : m === 6 || m === 7 ? 0.85 : 1;
      const v = Math.round((40 + r() * 55) * dayW[d] * season), lvl = v < 30 ? 0 : v < 48 ? 1 : v < 64 ? 2 : v < 80 ? 3 : 4;
      cells.push({ x: left + w * cs + cs / 2, y: top + d * cs + cs / 2, lvl, v, label: `${WD[dt.getDay()]} ${dt.getDate()} ${MONTHS[m]}` });
      if (d === 0 && m !== lastM) {
        lastM = m;
        months.push({ x: left + w * cs, t: MONTHS[m] });
      }
    }
  return { cells, months, w: left + W * cs, h: top + 7 * cs + 16 };
}

const FCm = [3.18, 3.05, 3.62, 3.55, 3.48, 3.6, 3.42, 3.5, 3.86, 3.95, 4.08, 4.21].map((v) => v * 1e6);
type Series = { lab: string[]; v: number[]; chg: string; full: (i: number) => string };
function fcData(p: Period): Series {
  if (p === 365) return { lab: MONTHS, v: FCm, chg: "+8.6%", full: (i) => MONTHS[i] + " 2026" };
  const r = seed(p * 13), n = p === 7 ? 7 : 30, lab: string[] = [], v: number[] = [];
  for (let i = 0; i < n; i++) {
    const dt = new Date(2026, 9, 24 - (n - 1 - i));
    lab.push(p === 7 ? WD[dt.getDay()] : String(dt.getDate()));
    const base = 4.08e6 / 30, dow = [0.6, 1.2, 1.1, 1.05, 1.1, 1.0, 0.8][dt.getDay()];
    v.push(base * dow * (0.85 + r() * 0.3) * (p === 30 ? 1 + i * 0.004 : 1));
  }
  return { lab, v, chg: p === 7 ? "+3.1%" : "+5.4%", full: (i) => (p === 7 ? lab[i] : "Oct " + lab[i]) };
}

type Bookings = Series & { cap: number[] };
function bkData(p: Period): Bookings {
  const r = seed(p * 7 + 3);
  if (p === 365)
    return {
      lab: MONTHS,
      cap: MONTHS.map(() => 200),
      v: [182, 150, 176, 168, 160, 171, 138, 144, 180, 190, 0, 0].map((v, i) => (i > 9 ? Math.round(160 + r() * 25) : v)),
      chg: "+11%",
      full: (i) => MONTHS[i] + " 2026",
    };
  const n = p === 7 ? 7 : 30, lab: string[] = [], v: number[] = [], cap: number[] = [];
  for (let i = 0; i < n; i++) {
    const dt = new Date(2026, 9, 24 - (n - 1 - i));
    lab.push(p === 7 ? WD[dt.getDay()] : String(dt.getDate()));
    const c = dt.getDay() === 0 ? 24 : 48;
    cap.push(c);
    v.push(Math.round(c * (0.55 + r() * 0.42)));
  }
  return { lab, cap, v, chg: p === 7 ? "+4%" : "+7%", full: (i) => (p === 7 ? lab[i] : "Oct " + lab[i]) };
}

// Avatar tints and chart colours are CSS vars on the section, so they follow the theme switch.
const AV = ["var(--av0)", "var(--av1)", "var(--av2)", "var(--av3)"];
type Area = "all" | "Floor" | "Studio" | "PT";
const PEOPLE: [string, string, string, Exclude<Area, "all">][] = [
  ["Bilal Ahmed", "On shift since 6:00 am", "Morning HIIT", "Studio"],
  ["Zara Malik", "Checked in 20 min ago", "Strength floor", "Floor"],
  ["Omar Siddiqui", "On shift since 7:30 am", "PT sessions", "PT"],
  ["Ayesha Raza", "Checked in 1 hour ago", "Spin studio", "Studio"],
  ["Danish Ali", "On shift since 9:00 am", "Front of floor", "Floor"],
  ["Mahnoor Tariq", "Checked in 2 hours ago", "Pilates", "Studio"],
  ["Faisal Javed", "On shift since noon", "PT sessions", "PT"],
  ["Sana Qureshi", "Checked in 40 min ago", "Women's hour", "Floor"],
  ["Hira Saleem", "On shift since 2:00 pm", "Boxing class", "Studio"],
  ["Kamran Shah", "Checked in 3 hours ago", "Strength floor", "Floor"],
  ["Nida Farooq", "On shift since 4:00 pm", "PT sessions", "PT"],
  ["Rehan Butt", "Checked in 10 min ago", "Evening HIIT", "Studio"],
];

const ALERTS = [
  { Icon: LuClock, color: "var(--warn)", t: "Sana Khalid's fee is due today", d: "Rs 2,000 left on her monthly plan" },
  { Icon: LuCalendarCheck, color: "var(--mint)", t: "Spin at 6:00 pm is full", d: "4 people on the waiting list" },
  { Icon: LuMessageCircle, color: "var(--info)", t: "New enquiry from your website", d: "Asked about personal training" },
  { Icon: LuWrench, color: "var(--mist)", t: "Treadmill 3 is due a service", d: "Logged in the asset register" },
];

const KPIS = [
  { Icon: LuUsers, lab: "Active members", v: 1248, pill: "+36", tone: "good" },
  { Icon: LuCalendarCheck, lab: "Classes booked", v: 164, pill: "+11%", tone: "good" },
  { Icon: LuWallet, lab: "Fees due this week", v: 42, pill: "steady", tone: "mute" },
  { Icon: LuShieldCheck, lab: "Expired memberships", v: 7, pill: "-4", tone: "good", bad: true },
] as const;

/* ---------------- small parts ---------------- */

function Seg({ value, onChange, label }: { value: Period; onChange: (p: Period) => void; label: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);
  const place = useCallback(() => {
    const on = wrap.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if (on) setThumb({ left: on.offsetLeft, width: on.offsetWidth });
  }, []);
  useIsoLayoutEffect(place, [value, place]);
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(place);
    ro.observe(el);
    document.fonts?.ready.then(place).catch(() => {});
    return () => ro.disconnect();
  }, [place]);
  return (
    <div ref={wrap} className={cx(s.seg, !thumb && s.segUnmeasured)} role="group" aria-label={label}>
      {thumb && <span className={s.th} style={{ left: thumb.left, width: thumb.width }} aria-hidden="true" />}
      {([7, 30, 365] as Period[]).map((p) => (
        <button key={p} type="button" aria-pressed={value === p} onClick={() => value !== p && onChange(p)}>
          {p === 7 ? "7 days" : p === 30 ? "30 days" : "12 months"}
        </button>
      ))}
    </div>
  );
}

type Anchor = { x: number; y: number; mode: "above" | "side" | "center" } | null;
function Tip({ anchor, children }: { anchor: Anchor; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || !anchor) return;
    const cw = (el.offsetParent as HTMLElement | null)?.clientWidth ?? 600;
    const w = el.offsetWidth, h = el.offsetHeight;
    let left: number, top: number;
    if (anchor.mode === "side") {
      left = anchor.x + 12;
      if (left + w > cw - 10) left = anchor.x - w - 12;
      top = anchor.y;
    } else {
      left = Math.max(8, Math.min(cw - w - 8, anchor.x - w / 2));
      top = anchor.mode === "above" ? anchor.y - h - 8 : anchor.y;
    }
    setPos((p) => (Math.abs(p.left - left) < 0.5 && Math.abs(p.top - top) < 0.5 ? p : { left, top }));
  }, [anchor, children]);
  return (
    <div ref={ref} className={cx(s.tip, anchor && s.tipShow)} style={pos} aria-hidden="true">
      {children}
    </div>
  );
}

/* ---------------- main ---------------- */

export default function GymPulse() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [intro, setIntro] = useState(0);

  // first reveal: count everything in once
  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduced || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting) {
          setIntro(1);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  // toast
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: "", show: false });
  const toastT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const say = useCallback((msg: string) => {
    setToast({ msg, show: true });
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2800);
  }, []);
  useEffect(() => () => clearTimeout(toastT.current), []);

  // notifications
  const [popOpen, setPopOpen] = useState(false);
  const [read, setRead] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!popOpen) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !bellRef.current?.contains(t)) setPopOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPopOpen(false);
        bellRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [popOpen]);

  /* attendance */
  const [cadP, setCadP] = useState<Period>(7);
  const cad = CAD[cadP];
  const [cadPct, confV] = useTween([cad.pct, cad.conf], { duration: 1000, ease: power3, reduced, intro });
  const heat = useMemo(buildHeat, []);
  const [heatTip, setHeatTip] = useState<{ i: number; anchor: Anchor } | null>(null);
  const heatCard = useRef<HTMLDivElement>(null);

  /* fees */
  const [fcP, setFcP] = useState<Period>(365);
  const fc = useMemo(() => fcData(fcP), [fcP]);
  const fcTotal = fc.v.reduce((a, b) => a + b, 0);
  const [fcV] = useTween([fcP === 365 ? fcTotal / 12 : fcTotal], { duration: 1000, ease: power3, reduced, intro });
  const fcVals = useTween(fc.v, { duration: 900, ease: expo, reduced, intro });
  const fcSvg = useRef<SVGSVGElement>(null);
  const fcCard = useRef<HTMLDivElement>(null);
  const fcW = useWidth(fcSvg);
  const [fcHov, setFcHov] = useState(-1);

  /* bookings */
  const [bkP, setBkP] = useState<Period>(365);
  const bk = useMemo(() => bkData(bkP), [bkP]);
  const [bkV] = useTween([bk.v.reduce((a, b) => a + b, 0)], { duration: 1000, ease: power3, reduced, intro });
  const bkVals = useTween(bk.v, { duration: 900, ease: expo, reduced, intro });
  const bkSvg = useRef<SVGSVGElement>(null);
  const bkCard = useRef<HTMLDivElement>(null);
  const bkW = useWidth(bkSvg);
  const [bkHov, setBkHov] = useState(-1);

  /* kpis */
  const kpiVals = useTween(
    KPIS.map((k) => k.v),
    { duration: 1000, ease: power3, reduced, intro }
  );

  /* trainers */
  const [area, setArea] = useState<Area>("all");
  const [page, setPage] = useState(0);
  const [shown, setShown] = useState<{ area: Area; page: number }>({ area: "all", page: 0 });
  const [phase, setPhase] = useState<"" | "l" | "r">("");
  const [phaseOut, setPhaseOut] = useState(false);
  const rosterT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(rosterT.current), []);
  const goRoster = (nextArea: Area, nextPage: number, dir: number) => {
    setArea(nextArea);
    setPage(nextPage);
    if (reduced) {
      setShown({ area: nextArea, page: nextPage });
      return;
    }
    clearTimeout(rosterT.current);
    setPhaseOut(true);
    setPhase(dir < 0 ? "l" : "r");
    rosterT.current = setTimeout(() => {
      setShown({ area: nextArea, page: nextPage });
      setPhase(dir < 0 ? "r" : "l");
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setPhaseOut(false);
          setPhase("");
        })
      );
    }, 220);
  };
  const listFor = (a: Area) => PEOPLE.filter((p) => a === "all" || p[3] === a);
  const reqList = listFor(area);
  const reqPages = Math.max(1, Math.ceil(reqList.length / 4));
  const shownList = listFor(shown.area);
  const shownPage = shown.page;

  /* ---- fees chart geometry ---- */
  const fcG = (() => {
    const W = fcW, H = 320, L = 56, R = 10, T = 24, B = 28, pw = W - L - R, ph = H - T - B, mx = nice(Math.max(...fc.v) * 1.1);
    const n = fcVals.length;
    const x = (i: number) => L + (n === 1 ? pw / 2 : (i / (n - 1)) * pw);
    const y = (v: number) => T + ph - (v / mx) * ph;
    let path = "";
    fcVals.forEach((v, i) => {
      const X = x(i), Y = y(v);
      if (!i) path = `M${X},${Y}`;
      else {
        const pX = x(i - 1), pY = y(fcVals[i - 1]), mX = (pX + X) / 2;
        path += ` C${mX},${pY} ${mX},${Y} ${X},${Y}`;
      }
    });
    return { W, H, L, R, T, ph, pw, mx, x, y, path, every: Math.ceil(n / 12), n };
  })();
  const onFcMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = fcSvg.current, card = fcCard.current;
    if (!svg || !card) return;
    const r = svg.getBoundingClientRect(), sc = r.width / fcG.W, L = fcG.L * sc, pw = fcG.pw * sc, n = fc.v.length;
    const i = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left - L) / pw) * (n - 1))));
    if (i === fcHov) return;
    setFcHov(i);
    const cr = card.getBoundingClientRect();
    setFcAnchor({ x: r.left - cr.left + L + (n === 1 ? pw / 2 : (i / (n - 1)) * pw), y: 96, mode: "side" });
  };
  const [fcAnchor, setFcAnchor] = useState<Anchor>(null);

  /* ---- bookings chart geometry ---- */
  const bkG = (() => {
    const W = bkW, H = 300, L = 40, R = 6, T = 14, B = 28, pw = W - L - R, ph = H - T - B, mx = Math.max(...bk.cap);
    const n = bkVals.length, band = pw / n, bw = Math.max(3, Math.min(band * 0.58, 40)), rad = Math.min(5, bw / 2.5);
    return { W, H, L, R, T, ph, pw, mx, n, band, bw, rad, y: (v: number) => (v / mx) * ph, every: Math.ceil(n / 12) };
  })();
  const [bkAnchor, setBkAnchor] = useState<Anchor>(null);
  const onBkMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = bkSvg.current, card = bkCard.current;
    if (!svg || !card) return;
    const r = svg.getBoundingClientRect(), sc = r.width / bkG.W, px = (e.clientX - r.left) / sc - bkG.L;
    if (px < 0 || px > bkG.pw) return;
    const i = Math.max(0, Math.min(bkG.n - 1, Math.floor(px / bkG.band)));
    if (i === bkHov) return;
    setBkHov(i);
    const cr = card.getBoundingClientRect();
    setBkAnchor({ x: r.left - cr.left + (bkG.L + bkG.band * i + bkG.band / 2) * sc, y: 96, mode: "center" });
  };

  // a range change while hovering would point at stale indices
  useEffect(() => {
    setFcHov(-1);
    setFcAnchor(null);
  }, [fcP]);
  useEffect(() => {
    setBkHov(-1);
    setBkAnchor(null);
  }, [bkP]);

  const heatCols = ["var(--h0)", "var(--h1)", "var(--h2)", "var(--h3)", "var(--h4)"];

  return (
    <section id="pulse" aria-label="Front desk demo" className={s.section}>
      <div className={s.pulse} ref={rootRef}>
        <p className={s.lead}>
          Once you&apos;re live, <b>this is your front desk view</b>. Try it out. The numbers belong to a demo gym.
        </p>

        {/* header */}
        <div className={cx(s.card, s.head)}>
          <div>
            <div className={s.crumb}>
              <GMark className={s.mk} />
              Iron House Gym<span className={s.sep}>/</span>
              <span className={s.op}>FD</span>Front desk<span className={s.sep}>/</span>
              <LuActivity className={s.crumbIc} aria-hidden="true" />
              Pulse
            </div>
            <h3>Gym pulse</h3>
            <p>A clear view of your members and your money.</p>
          </div>
          <div className={s.acts}>
            <button
              ref={bellRef}
              type="button"
              className={cx(s.btn, s.bell)}
              aria-label={read ? "Notifications" : "Notifications, 4 unread"}
              aria-expanded={popOpen}
              aria-controls="gp-pulse-pop"
              onClick={() => {
                setPopOpen((o) => !o);
                setRead(true);
              }}
            >
              <LuBellRing aria-hidden="true" />
              {!read && <span className={s.badge}>4</span>}
            </button>
            <button type="button" className={s.btn} onClick={() => say("Members opens the full member list in the real app.")}>
              <LuUsers aria-hidden="true" />
              <span className={s.lbl}>Members</span>
            </button>
            <button type="button" className={cx(s.btn, s.pri)} aria-label="Add member" onClick={() => say("In your gym, this opens the desk sign-up form.")}>
              <LuUserPlus aria-hidden="true" />
              <span className={s.lbl}>Add member</span>
            </button>
            <div ref={popRef} id="gp-pulse-pop" className={cx(s.pop, popOpen && s.popOpen)} role="region" aria-label="Notifications">
              {ALERTS.map(({ Icon, color, t, d }) => (
                <div key={t} className={s.it}>
                  <Icon style={{ color }} aria-hidden="true" />
                  <div>
                    {t}
                    <small>{d}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* row 1: attendance + fees */}
        <div className={s.r1}>
          <div className={s.card} ref={heatCard}>
            <div className={s.top}>
              <div className={s.ttl}>
                <span className={s.ico}>
                  <LuActivity aria-hidden="true" />
                </span>
                <div>
                  <h4>Attendance rhythm</h4>
                  <small>How steadily members are coming in</small>
                </div>
              </div>
              <Seg value={cadP} onChange={setCadP} label="Attendance range" />
            </div>
            <div className={s.hero}>
              <div>
                <div className={s.big}>
                  <b>{Math.round(cadPct)}%</b>
                  <span className={cx(s.pill, cad.tag === "healthy" ? s.good : s.mute)}>{cad.tag}</span>
                </div>
                <div className={s.sub}>{cad.run}</div>
              </div>
              <div className={s.conf}>
                <div className={s.row}>
                  <span>Fees paid on time</span>
                  <b>{Math.round(confV)}%</b>
                </div>
                <div className={s.bar}>
                  <i style={{ transform: `scaleX(${Math.max(0, confV) / 100})` }} />
                </div>
              </div>
            </div>
            <div className={s.strip}>
              {cad.stats.map(([v, l]) => (
                <div key={l}>
                  <b>{v}</b>
                  <span>{l}</span>
                </div>
              ))}
            </div>
            <div className={s.heat}>
              <div className={s.hd}>
                <div>
                  <h5>Daily rhythm</h5>
                  <small>Check-ins across the rolling year</small>
                </div>
                <div className={s.leg} aria-hidden="true">
                  Quiet
                  {heatCols.map((c) => (
                    <i key={c} style={{ background: c }} />
                  ))}
                  Busy
                </div>
              </div>
              <svg
                viewBox={`0 0 ${heat.w} ${heat.h}`}
                role="img"
                aria-label="Daily check-ins over the last year"
                onPointerOver={(e) => {
                  const t = e.target as Element;
                  const i = t.tagName === "circle" ? Number(t.getAttribute("data-i")) : -1;
                  const card = heatCard.current;
                  if (i < 0 || !card) return setHeatTip(null);
                  const cr = card.getBoundingClientRect(), r2 = t.getBoundingClientRect();
                  setHeatTip({ i, anchor: { x: r2.left - cr.left + r2.width / 2, y: r2.top - cr.top, mode: "above" } });
                }}
                onPointerLeave={() => setHeatTip(null)}
              >
                {[1, 3, 5].map((d) => (
                  <text key={d} x={0} y={4 + d * 10 + 5 + 3}>
                    {WD[d]}
                  </text>
                ))}
                {heat.cells.map((c, i) => (
                  <circle key={i} cx={c.x} cy={c.y} r={3.4} style={{ fill: heatCols[c.lvl] }} data-i={i} />
                ))}
                {heat.months.map((m) => (
                  <text key={m.x} x={m.x} y={4 + 70 + 12}>
                    {m.t}
                  </text>
                ))}
              </svg>
            </div>
            <Tip anchor={heatTip?.anchor ?? null}>
              {heatTip && (
                <>
                  <b>{heat.cells[heatTip.i].v} check-ins</b>
                  <span>{heat.cells[heatTip.i].label}</span>
                </>
              )}
            </Tip>
          </div>

          <div className={cx(s.card, s.chart)} ref={fcCard}>
            <div className={s.top}>
              <div>
                <h4 className={s.h4m}>Fees collected</h4>
                <div className={s.big} style={{ marginTop: 8 }}>
                  <b className={s.bigSm} title={fcP === 365 ? "Average a month" : "Total for the period"}>
                    {rs(fcV)}
                  </b>
                  <span className={cx(s.pill, s.good)}>{fc.chg}</span>
                </div>
              </div>
              <Seg value={fcP} onChange={setFcP} label="Fees range" />
            </div>
            <svg
              ref={fcSvg}
              height={320}
              viewBox={`0 0 ${fcG.W} ${fcG.H}`}
              role="img"
              aria-label="Fees collected over time"
              onPointerMove={onFcMove}
              onPointerLeave={() => {
                setFcHov(-1);
                setFcAnchor(null);
              }}
            >
              <defs>
                <linearGradient id="gp-pulse-fg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" style={{ stopColor: "var(--pl-line)" }} stopOpacity=".22" />
                  <stop offset="1" style={{ stopColor: "var(--pl-line)" }} stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 0.5, 1].map((k) => {
                const yy = fcG.T + fcG.ph - k * fcG.ph;
                return (
                  <g key={k}>
                    <line className={s.grid} x1={fcG.L} x2={fcG.W - fcG.R} y1={yy} y2={yy} />
                    <text x={fcG.L - 10} y={yy + 4} textAnchor="end">
                      {rs(k * fcG.mx)}
                    </text>
                  </g>
                );
              })}
              <path d={`${fcG.path} L${fcG.x(fcG.n - 1)},${fcG.T + fcG.ph} L${fcG.L},${fcG.T + fcG.ph} Z`} fill="url(#gp-pulse-fg)" />
              <path d={fcG.path} fill="none" style={{ stroke: "var(--pl-line)" }} strokeWidth={2.2} />
              {fc.lab.map((l, i) =>
                i % fcG.every === 0 || i === fc.lab.length - 1 ? (
                  <text key={i} x={fcG.x(i)} y={fcG.H - 6} textAnchor="middle">
                    {l}
                  </text>
                ) : null
              )}
              {fcHov >= 0 && fcHov < fcVals.length && (
                <>
                  <line className={s.cross} x1={fcG.x(fcHov)} x2={fcG.x(fcHov)} y1={fcG.T} y2={fcG.T + fcG.ph} />
                  <circle cx={fcG.x(fcHov)} cy={fcG.y(fcVals[fcHov])} r={5} style={{ fill: "var(--pc)", stroke: "var(--pl-line)" }} strokeWidth={2.2} />
                </>
              )}
            </svg>
            <Tip anchor={fcHov >= 0 ? fcAnchor : null}>
              {fcHov >= 0 && fcHov < fc.v.length && (
                <>
                  <b>{rs(fc.v[fcHov])}</b>
                  <span>{fc.full(fcHov)}</span>
                </>
              )}
            </Tip>
          </div>
        </div>

        {/* kpis */}
        <div className={s.kpis}>
          {KPIS.map((k, i) => (
            <div key={k.lab} className={cx(s.card, s.kpi)}>
              <span className={cx(s.ico, "bad" in k && s.icoBad)}>
                <k.Icon aria-hidden="true" />
              </span>
              <span className={s.lab}>{k.lab}</span>
              <div className={s.v}>
                <b>{num(kpiVals[i] ?? k.v)}</b>
                <span className={cx(s.pill, k.tone === "good" ? s.good : s.mute)}>{k.pill}</span>
              </div>
            </div>
          ))}
        </div>

        {/* row 3: trainers + bookings */}
        <div className={s.r3}>
          <div className={s.card}>
            <div className={s.top}>
              <div>
                <h4 className={s.h4m}>Trainers on shift</h4>
                <div className={s.cnt} aria-live="polite">
                  {reqList.length} on shift
                </div>
              </div>
              <label className={s.srOnly} htmlFor="gp-pulse-area">
                Area
              </label>
              <select id="gp-pulse-area" className={s.sel} value={area} onChange={(e) => goRoster(e.target.value as Area, 0, 1)}>
                <option value="all">All areas</option>
                <option value="Floor">Gym floor</option>
                <option value="Studio">Studios</option>
                <option value="PT">Personal training</option>
              </select>
            </div>
            <div className={cx(s.people, phaseOut && s.out, phase === "l" && s.outL, phase === "r" && s.outR)}>
              {shownList.length ? (
                shownList.slice(shownPage * 4, shownPage * 4 + 4).map((p, i) => (
                  <div key={p[0]} className={s.per}>
                    <div className={s.perT}>
                      <span className={s.av} style={{ background: AV[(shownPage * 4 + i) % 4] }} aria-hidden="true">
                        {p[0]
                          .split(" ")
                          .map((w) => w[0])
                          .join("")}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <b>{p[0]}</b>
                        <small>{p[1]}</small>
                      </div>
                    </div>
                    <div className={s.tag}>{p[2]}</div>
                  </div>
                ))
              ) : (
                <div className={s.empty}>No trainers on shift in this area right now.</div>
              )}
            </div>
            <div className={s.pg}>
              <button type="button" disabled={page === 0} onClick={() => goRoster(area, page - 1, -1)}>
                <LuChevronLeft aria-hidden="true" />
                Earlier
              </button>
              <button type="button" disabled={page >= reqPages - 1} onClick={() => goRoster(area, page + 1, 1)}>
                Later
                <LuChevronRight aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className={cx(s.card, s.chart)} ref={bkCard}>
            <div className={s.top}>
              <div>
                <h4 className={s.h4m}>Class bookings</h4>
                <div className={s.big} style={{ marginTop: 8 }}>
                  <b className={s.bigSm}>{num(bkV)} booked</b>
                  <span className={cx(s.pill, s.good)}>{bk.chg}</span>
                </div>
              </div>
              <Seg value={bkP} onChange={setBkP} label="Bookings range" />
            </div>
            <svg
              ref={bkSvg}
              height={300}
              viewBox={`0 0 ${bkG.W} ${bkG.H}`}
              role="img"
              aria-label="Class spots booked against capacity"
              onPointerMove={onBkMove}
              onPointerLeave={() => {
                setBkHov(-1);
                setBkAnchor(null);
              }}
            >
              {[0, 0.5, 1].map((k) => {
                const yy = bkG.T + bkG.ph - k * bkG.ph;
                return (
                  <g key={k}>
                    <line className={s.grid} x1={bkG.L} x2={bkG.W - bkG.R} y1={yy} y2={yy} />
                    <text x={bkG.L - 8} y={yy + 4} textAnchor="end">
                      {Math.round(k * bkG.mx)}
                    </text>
                  </g>
                );
              })}
              {bkVals.map((val, i) => {
                const c = bkG.L + bkG.band * i + bkG.band / 2, x0 = c - bkG.bw / 2, hc = bkG.y(bk.cap[i] ?? 0), hv = bkG.y(val), on = i === bkHov;
                return (
                  <g key={i}>
                    <rect x={x0} y={bkG.T + bkG.ph - hc} width={bkG.bw} height={hc} rx={bkG.rad} style={{ fill: on ? "var(--pl-track-on)" : "var(--pl-track)" }} />
                    {hv > 1 && <rect x={x0} y={bkG.T + bkG.ph - hv} width={bkG.bw} height={hv} rx={bkG.rad} style={{ fill: on ? "var(--pl-bar-on)" : "var(--pl-bar)" }} />}
                    {(i % bkG.every === 0 || i === bkG.n - 1) && (
                      <text x={c} y={bkG.H - 6} textAnchor="middle" style={on ? { fill: "var(--bone)" } : undefined}>
                        {bk.lab[i]}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            <Tip anchor={bkHov >= 0 ? bkAnchor : null}>
              {bkHov >= 0 && bkHov < bk.v.length && (
                <>
                  <b>
                    {bk.v[bkHov]} of {bk.cap[bkHov]} spots
                  </b>
                  <span>
                    {bk.full(bkHov)}, {Math.round((bk.v[bkHov] / bk.cap[bkHov]) * 100)}% full
                  </span>
                </>
              )}
            </Tip>
          </div>
        </div>
      </div>

      <div className={cx(s.toast, toast.show && s.toastShow)} role="status" aria-live="polite">
        {toast.msg}
      </div>
    </section>
  );
}

"use client";

// The /features list: a sticky row of area tabs (the one for the area on
// screen is lit, with a sliding pill), then one block per area with a card for each
// feature leading to its own page. The area chips jump to an area and light
// up for the area on screen; ?area=<n> or ?area=<groupKey> opens the page
// scrolled to one area. Cards keep the feature's slug as their id so
// /features#<slug> from the header's menu still lands on (and lights) them.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { FiArrowRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FEATURES, FEATURE_GROUPS, featureHref, type GroupKey } from "@/content/features";
import { FEATURE_ICONS } from "./featureIcons";
import { AREA_ICONS, featuresLabel, shortLabel, tintVars } from "./featureAreas";
import s from "./AllFeatures.module.css";

type Area = GroupKey | "all";

// Each area sets its dark and light tint; the CSS picks one as --c.
const tint = (key: GroupKey) => tintVars(key) as CSSProperties;

function areaFromQuery(value: string | null): Area {
  if (!value) return "all";
  if (/^\d+$/.test(value)) return FEATURE_GROUPS[Number(value)]?.key ?? "all";
  return FEATURE_GROUPS.find((g) => g.key === value)?.key ?? "all";
}


// One area's cards as a carousel: arrows either side move a page at a time,
// dots below show (and jump to) each page. Touch and trackpad swipe still
// work; the scrollbar itself is hidden. So people can tell a row moves, the
// first time it comes into view it peeks sideways and back, the next arrow
// pulses until it is used, and the edges fade where more cards are hidden.
function Row({ label, resetKey, children }: { label: string; resetKey: string; children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);
  const [touched, setTouched] = useState(false);
  const [seen, setSeen] = useState(false);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const n = Math.max(1, Math.ceil((el.scrollWidth - 4) / w));
    const atEnd = el.scrollLeft + w >= el.scrollWidth - 4;
    setPages(n);
    setPage(atEnd ? n - 1 : Math.min(n - 1, Math.round(el.scrollLeft / w)));
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    el.scrollLeft = 0;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [measure, resetKey]);

  // The one-time peek when the row is first well in view.
  useEffect(() => {
    const box = wrap.current;
    const el = track.current;
    if (!box || !el || pages < 2 || seen) return;
    let timers: number[] = [];
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setSeen(true);
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || el.scrollLeft > 0) return;
        const snap = el.style.scrollSnapType;
        el.style.scrollSnapType = "none";
        timers = [
          window.setTimeout(() => el.scrollTo({ left: Math.min(90, el.clientWidth * 0.12), behavior: "smooth" }), 350),
          window.setTimeout(() => el.scrollTo({ left: 0, behavior: "smooth" }), 950),
          window.setTimeout(() => (el.style.scrollSnapType = snap), 1600),
        ];
      },
      { threshold: 0.6 }
    );
    io.observe(box);
    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [pages, seen]);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    setTouched(true);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = Math.max(0, Math.min(pages - 1, i));
    el.scrollTo({ left: target * el.clientWidth, behavior: still ? "auto" : "smooth" });
  };

  const multi = pages > 1;
  const edges = multi ? `${page > 0 ? s.fadeL : ""} ${page < pages - 1 ? s.fadeR : ""}` : "";
  return (
    <div ref={wrap} className={`${s.row} ${seen || !multi ? s.seen : ""}`} role="region" aria-roledescription="carousel" aria-label={label}>
      <div className={s.rowIn}>
        {multi && (
          <button type="button" className={`${s.arrow} ${s.prev}`} onClick={() => go(page - 1)} disabled={page === 0} aria-label={`Previous ${label} features`}>
            <FiChevronLeft aria-hidden="true" />
          </button>
        )}
        <div ref={track} className={`${s.grid} ${s.in} ${edges}`} onPointerDown={() => setTouched(true)} onWheel={(e) => Math.abs(e.deltaX) > 2 && setTouched(true)}>
          {children}
        </div>
        {multi && (
          <button type="button" className={`${s.arrow} ${s.next} ${!touched && page === 0 ? s.call : ""}`} onClick={() => go(page + 1)} disabled={page === pages - 1} aria-label={`Next ${label} features`}>
            <FiChevronRight aria-hidden="true" />
          </button>
        )}
      </div>
      {multi && (
        <div className={s.dots}>
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} type="button" className={i === page ? s.dotOn : s.dot} onClick={() => go(i)} aria-label={`${label}: page ${i + 1} of ${pages}`} aria-current={i === page ? "true" : undefined} />
          ))}
          <span className={s.count} aria-hidden="true">
            {page + 1} / {pages}
          </span>
        </div>
      )}
    </div>
  );
}

export default function AllFeatures() {
  // The chips no longer filter: every area stays on the page, a chip scrolls
  // to its area, and the chip of the area on screen is lit (scroll-spy).
  const [area, setArea] = useState<Area>("all");
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const chips = useRef<HTMLDivElement>(null);
  // While a chip's smooth scroll runs, the spy keeps that chip lit.
  const lockUntil = useRef(0);

  const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scrollToArea = useCallback((next: Area, smooth: boolean) => {
    const behavior: ScrollBehavior = smooth && !still() ? "smooth" : "auto";
    if (next === "all") {
      const top = (root.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 96;
      window.scrollTo({ top: Math.max(0, top), behavior });
    } else {
      document.getElementById(next)?.scrollIntoView({ behavior, block: "start" });
    }
  }, []);

  // ?area= opens the page scrolled to that area.
  useEffect(() => {
    const first = areaFromQuery(new URLSearchParams(window.location.search).get("area"));
    if (first !== "all") {
      setArea(first);
      lockUntil.current = performance.now() + 600;
      requestAnimationFrame(() => scrollToArea(first, false));
    }
  }, [scrollToArea]);

  // Arriving from a homepage card (/features#<area> or #<feature-slug>): land
  // on that row, slide the row so the card is in view, and give it a pop
  // (the ring glow itself is TargetGlow.tsx). An area gets its heading lit.
  useEffect(() => {
    let timers: number[] = [];
    const go = () => {
      let id = "";
      try {
        id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      } catch {
        return;
      }
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      const grp = el.classList.contains(s.grp) ? el : el.closest<HTMLElement>(`.${s.grp}`);
      if (!grp) return;
      lockUntil.current = performance.now() + 1400;
      setArea(grp.id as Area);
      if (el !== grp) {
        // Horizontal first, at once, so the row's one-time peek sees it moved and stays put.
        const track = el.parentElement;
        if (track && track.scrollWidth > track.clientWidth) {
          const snap = track.style.scrollSnapType;
          track.style.scrollSnapType = "none";
          track.scrollLeft = Math.max(0, el.offsetLeft - 4);
          timers.push(window.setTimeout(() => (track.style.scrollSnapType = snap), 400));
        }
      }
      grp.scrollIntoView({ block: "start", behavior: still() ? "auto" : "smooth" });
      const lit = el === grp ? grp : el;
      const cls = el === grp ? s.flashGrp : s.pop;
      lit.classList.remove(cls);
      void lit.offsetWidth;
      lit.classList.add(cls);
      timers.push(window.setTimeout(() => lit.classList.remove(cls), 2400));
    };
    timers.push(window.setTimeout(go, 250));
    window.addEventListener("hashchange", go);
    return () => {
      window.removeEventListener("hashchange", go);
      timers.forEach((t) => window.clearTimeout(t));
      timers = [];
    };
  }, []);

  // Scroll-spy: the last area whose top has passed just under the sticky bar.
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      if (performance.now() < lockUntil.current) return;
      const line = (bar.current?.getBoundingClientRect().bottom ?? 0) + 40;
      let current: Area = "all";
      for (const g of FEATURE_GROUPS) {
        const el = document.getElementById(g.key);
        if (el && el.getBoundingClientRect().top <= line) current = g.key;
      }
      setArea(current);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // A pill slides under the lit chip, and the chip row scrolls sideways to
  // keep it in view.
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  useEffect(() => {
    const row = chips.current;
    const chip = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !chip) return;
    setPill({ left: chip.offsetLeft, width: chip.offsetWidth });
    const left = chip.offsetLeft;
    if (left < row.scrollLeft || left + chip.offsetWidth > row.scrollLeft + row.clientWidth) {
      row.scrollTo({ left: left - 12, behavior: still() ? "auto" : "smooth" });
    }
  }, [area]);

  const pick = (next: Area) => {
    setArea(next);
    lockUntil.current = performance.now() + 900;
    scrollToArea(next, true);
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("area");
    else url.searchParams.set("area", next);
    url.hash = "";
    window.history.replaceState(window.history.state, "", url);
  };

  const groups = useMemo(() => FEATURE_GROUPS.map((g) => ({ group: g, items: FEATURES.filter((f) => f.group === g.key) })), []);

  const shown = groups.reduce((n, x) => n + x.items.length, 0);
  const counts = useMemo(() => Object.fromEntries(FEATURE_GROUPS.map((g) => [g.key, FEATURES.filter((f) => f.group === g.key).length])), []);
  let k = 0;

  return (
    <div ref={root} className={s.root}>
      <div ref={bar} className={s.bar}>
        <div ref={chips} className={s.chips} role="group" aria-label="Jump to an area">
          <button type="button" className={s.chip} aria-pressed={area === "all"} onClick={() => pick("all")}>
            All<span>{FEATURES.length}</span>
          </button>
          {FEATURE_GROUPS.map((g) => (
            <button key={g.key} type="button" className={s.chip} aria-pressed={area === g.key} onClick={() => pick(g.key)}>
              {shortLabel(g.label)}<span>{counts[g.key]}</span>
            </button>
          ))}
          {pill && <span className={s.pill} style={{ transform: `translateX(${pill.left}px)`, width: pill.width }} aria-hidden="true" />}
        </div>
      </div>

      <p className={s.status}>
        {`Every feature, by area · ${featuresLabel(shown)}`}
      </p>

      {groups.map(({ group, items }) => {
        const GroupIcon = AREA_ICONS[group.key];
        return (
          <section key={group.key} id={group.key} aria-labelledby={`${group.key}-title`} className={s.grp} style={tint(group.key)}>
            <div className={s.gh}>
              <span className={s.ic} aria-hidden="true">
                <GroupIcon />
              </span>
              <div>
                <h2 id={`${group.key}-title`}>{group.title}</h2>
                <p>{group.text}</p>
              </div>
            </div>
            <Row resetKey={group.key} label={group.label}>
              {items.map((f) => {
                const Icon = FEATURE_ICONS[f.key];
                return (
                  <Link key={f.key} id={f.slug} href={featureHref(f.key)} className={`feature-anchor ${s.card}`} style={{ "--k": k++ } as CSSProperties}>
                    <span className={s.top}>
                      <span className={`${s.ic} ${s.sm}`} aria-hidden="true">
                        <Icon />
                      </span>
                      {f.addon && <span className={s.tag}>Add-on</span>}
                    </span>
                    <b>{f.name}</b>
                    <span className={s.desc}>{f.short}</span>
                    <em>
                      Open <FiArrowRight aria-hidden="true" />
                    </em>
                  </Link>
                );
              })}
            </Row>
          </section>
        );
      })}

    </div>
  );
}

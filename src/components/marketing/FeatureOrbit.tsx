"use client";

// "31 features in eight areas": a sticky, scroll-driven 3D carousel with one
// card per feature area. Scrolling through the section turns the carousel;
// the tabs at the bottom jump to an area. On phones, and for anyone who asks
// for less motion, it lays flat: a swipeable row (phones) or a grid.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { FiChevronRight, FiLock } from "react-icons/fi";
import { LuCrown, LuFingerprint } from "react-icons/lu";
import { FEATURE_GROUPS, FEATURES, featuresIn, type GroupKey } from "@/content/features";
import { AREA_ICONS, featuresLabel, numberWord, shortLabel, tintVars } from "./featureAreas";
import ViewAllFeaturesButton from "./ViewAllFeaturesButton";
import s from "./FeatureOrbit.module.css";

const AREAS = FEATURE_GROUPS.map((g) => ({ ...g, count: featuresIn(g.key).length }));
const LAST = AREAS.length - 1;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const areaHref = (key: GroupKey) => `/features#${key}`;

export default function FeatureOrbit() {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const dimRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pillRef = useRef<HTMLSpanElement>(null);
  const [flat, setFlat] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState(0);

  // Phones and reduced motion get the flat layout.
  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const phone = window.matchMedia("(max-width: 640px)");
    const update = () => {
      setReduced(rm.matches);
      setFlat(rm.matches || phone.matches);
    };
    update();
    rm.addEventListener("change", update);
    phone.addEventListener("change", update);
    return () => {
      rm.removeEventListener("change", update);
      phone.removeEventListener("change", update);
    };
  }, []);

  // The 3D carousel, driven by how far the section has scrolled.
  useEffect(() => {
    if (flat) return;
    const sec = sectionRef.current;
    const track = trackRef.current;
    if (!sec || !track) return;
    const cards = cardRefs.current;
    const dims = dimRefs.current;
    let f = 0;
    let tf = 0;
    let running = false;
    let near = true;
    let raf = 0;
    let shown = -1;

    const total = () => Math.max(1, sec.offsetHeight - window.innerHeight);
    const read = () => {
      tf = clamp(-sec.getBoundingClientRect().top / total(), 0, 1) * LAST;
    };
    const paint = () => {
      f += (tf - f) * 0.12;
      if (Math.abs(tf - f) < 0.0005) f = tf;
      const w = track.offsetWidth;
      cards.forEach((c, i) => {
        if (!c) return;
        const d = i - f;
        const ad = Math.abs(d);
        const sg = Math.sign(d);
        const x = sg * w * (0.66 * Math.min(ad, 1) + 0.3 * Math.max(ad - 1, 0));
        c.style.transform = `translateX(${x}px) translateZ(${-Math.min(ad, 3) * 170}px) rotateY(${-clamp(d, -2, 2) * 36}deg)`;
        c.style.opacity = String(ad > 2.7 ? 0 : 1 - Math.max(ad - 1.7, 0));
        c.style.zIndex = String(100 - Math.round(ad * 10));
        c.style.setProperty("--rim", String(Math.min(ad, 1) * 0.9));
        c.style.setProperty("--rimdir", d > 0 ? "90deg" : "270deg");
        c.style.pointerEvents = ad > 2.2 ? "none" : "auto";
        const dim = dims[i];
        if (dim) dim.style.opacity = String(Math.min(0.55, ad * 0.45 + Math.max(ad - 1, 0) * 0.2));
      });
      const ai = Math.round(f);
      if (ai !== shown) {
        shown = ai;
        setActive(ai);
      }
      if (f !== tf && near) raf = requestAnimationFrame(paint);
      else running = false;
    };
    const kick = () => {
      if (!running && near) {
        running = true;
        raf = requestAnimationFrame(paint);
      }
    };
    const onScroll = () => {
      read();
      kick();
    };
    const io = new IntersectionObserver(
      ([en]) => {
        near = en.isIntersecting;
        kick();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(sec);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    read();
    f = tf;
    running = true;
    paint();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cards.forEach((c) => {
        if (!c) return;
        c.style.transform = "";
        c.style.opacity = "";
        c.style.zIndex = "";
        c.style.pointerEvents = "";
        c.style.removeProperty("--rim");
        c.style.removeProperty("--rimdir");
      });
      dims.forEach((d) => {
        if (d) d.style.opacity = "";
      });
    };
  }, [flat]);

  // In the flat row (phones), the tab follows the card swiped into view.
  useEffect(() => {
    if (!flat) return;
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      if (track.scrollWidth <= track.clientWidth) return;
      const first = cardRefs.current[0];
      const second = cardRefs.current[1];
      const step = first && second ? second.offsetLeft - first.offsetLeft : track.clientWidth;
      setActive(clamp(Math.round(track.scrollLeft / Math.max(1, step)), 0, LAST));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [flat]);

  // The sliding pill behind the active tab.
  const placePill = useCallback(() => {
    const tab = tabRefs.current[active];
    const tabs = tabsRef.current;
    const pill = pillRef.current;
    if (!tab || !tabs || !pill) return;
    pill.style.left = `${tab.offsetLeft}px`;
    pill.style.width = `${tab.offsetWidth}px`;
    if (tabs.scrollWidth > tabs.clientWidth) {
      tabs.scrollTo({ left: tab.offsetLeft - tabs.clientWidth / 2 + tab.offsetWidth / 2, behavior: reduced ? "instant" : "smooth" });
    }
  }, [active, reduced]);

  useEffect(() => {
    placePill();
    window.addEventListener("resize", placePill);
    return () => window.removeEventListener("resize", placePill);
  }, [placePill, flat]);

  const goto = (i: number) => {
    const behavior: ScrollBehavior = reduced ? "instant" : "smooth";
    if (!flat) {
      const sec = sectionRef.current;
      if (!sec) return;
      const top = sec.getBoundingClientRect().top + window.scrollY;
      const total = Math.max(1, sec.offsetHeight - window.innerHeight);
      window.scrollTo({ top: top + (i / LAST) * total + 2, behavior });
      return;
    }
    const track = trackRef.current;
    const card = cardRefs.current[i];
    if (!track || !card) return;
    setActive(i);
    if (track.scrollWidth > track.clientWidth) {
      const first = cardRefs.current[0];
      track.scrollTo({ left: card.offsetLeft - (first?.offsetLeft ?? 0), behavior });
    } else {
      card.scrollIntoView({ block: "nearest", behavior });
    }
  };

  const open = (i: number) => {
    if (!flat && i !== active) goto(i);
    else router.push(areaHref(AREAS[i].key));
  };

  const onCardClick = (i: number) => (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) return;
    open(i);
  };
  const onCardKey = (i: number) => (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open(i);
    }
  };
  const onCardMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <section ref={sectionRef} id="areas" aria-labelledby="areas-title" className={`${s.orbit} ${flat ? s.flat : ""}`} style={{ "--steps": LAST } as CSSProperties}>
      <div className={s.stage}>
        <div className={s.head}>
          {/* The owner wanted the "View all features" button here instead of a
              visible heading; the heading stays for screen readers. */}
          <h2 id="areas-title" className="sr-only">
            {FEATURES.length} features in {numberWord(AREAS.length)} areas
          </h2>
          <ViewAllFeaturesButton size="lg" count={FEATURES.length} />
        </div>

        <div ref={trackRef} className={s.track}>
          {AREAS.map((a, i) => {
            const Icon = AREA_ICONS[a.key];
            return (
              <article
                key={a.key}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={`${s.card} ${i === active ? s.live : ""}`}
                style={tintVars(a.key) as CSSProperties}
                tabIndex={0}
                role="button"
                aria-label={`${a.label}, ${featuresLabel(a.count)}`}
                onClick={onCardClick(i)}
                onKeyDown={onCardKey(i)}
                onPointerMove={onCardMove}
              >
                <div className={s.top}>
                  <span>{a.label}</span>
                  <span className={s.icon} aria-hidden>
                    <Icon />
                  </span>
                </div>
                <h3>{a.title}</h3>
                <p className={s.intro}>{a.text}</p>
                <div className={s.vig} aria-hidden>
                  <Vignette area={a.key} />
                </div>
                <div className={s.foot}>
                  <span>{featuresLabel(a.count)}</span>
                  <Link href={areaHref(a.key)} className={s.go} tabIndex={-1}>
                    Open <FiChevronRight aria-hidden />
                  </Link>
                </div>
                <span
                  className={s.dim}
                  ref={(el) => {
                    dimRefs.current[i] = el;
                  }}
                />
              </article>
            );
          })}
        </div>

        <div ref={tabsRef} className={s.tabs} role="tablist" aria-label="Feature areas">
          <span ref={pillRef} className={s.pill} aria-hidden />
          {AREAS.map((a, i) => (
            <button
              key={a.key}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`${s.tab} ${i === active ? s.tabOn : ""}`}
              onClick={() => goto(i)}
            >
              <span>{shortLabel(a.label)}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// A small, made-up glimpse of each area, as on the reference. The front card
// gets .live, which plays its scene (rows slide in and pulse in turn, bars
// grow, the receipt prints, the chat replies); the others sit still.
function Vignette({ area }: { area: GroupKey }) {
  const row = (av: ReactNode, name: string, sub: string, tag: string, tone?: "m" | "e") => (
    <div className={s.row}>
      <span className={s.av}>{av}</span>
      <span className={s.rowText}>
        {name}
        <small>{sub}</small>
      </span>
      <span className={`${s.tag} ${tone === "m" ? s.tagMint : tone === "e" ? s.tagEmber : ""}`}>{tag}</span>
    </div>
  );
  switch (area) {
    case "desk":
      return (
        <>
          {row("AR", "Ali Raza", "Monthly, renewed today", "Paid", "m")}
          {row("SK", "Sana Khalid", "Paid half, rest on Friday", "Rs 2,000 due", "e")}
        </>
      );
    case "checkin":
      return (
        <div className={s.scan}>
          <span className={s.ring}>
            <LuFingerprint />
          </span>
          <div>
            <div className={s.scanName}>Hamid Mir checked in</div>
            <div className={s.scanSay}>
              &ldquo;Fee due today&rdquo;
              <span className={s.eq}>
                <i />
                <i />
                <i />
                <i />
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <span className={s.tag}>47 in the gym now</span>
            </div>
          </div>
        </div>
      );
    case "money":
      return (
        <>
          <div className={s.figure}>
            <span>Today&apos;s takings</span>
            <strong>Rs 48,500</strong>
          </div>
          <div className={s.bars}>
            {[40, 62, 48, 75, 55, 68, 92].map((h, i, all) => (
              <b key={i} className={i === all.length - 1 ? s.barHi : undefined} style={{ height: `${h}%`, "--i": i } as CSSProperties} />
            ))}
          </div>
        </>
      );
    case "shop":
      return (
        <div className={s.receipt}>
          <div className={s.rh}>IRON HOUSE GYM</div>
          <div className={s.ln}>
            <span>Protein shake</span>
            <span>650</span>
          </div>
          <div className={s.ln}>
            <span>Locker, 1 month</span>
            <span>300</span>
          </div>
          <div className={`${s.ln} ${s.tot}`}>
            <span>Total</span>
            <span>Rs 950</span>
          </div>
        </div>
      );
    case "classes":
      return (
        <>
          {row("07", "HIIT", "Studio 1, 45 min", "12 of 16", "m")}
          {row("18", "Spin", "Studio 2, 40 min", "Full", "e")}
        </>
      );
    case "team":
      return (
        <>
          {row("BK", "Bilal, trainer", "Salary + 10% of PT sessions", "Payslip ready", "m")}
          {row("ZA", "Zara, front desk", "Mornings this week", "On rota")}
        </>
      );
    case "reach":
      return (
        <div className={s.chat}>
          <div className={s.bubble}>Hi Ali, your membership renews on Friday.</div>
          <div className={`${s.bubble} ${s.bubbleMe}`}>Thanks! I&apos;ll pay at the desk.</div>
        </div>
      );
    case "control":
      return (
        <>
          {row(<LuCrown />, "Owner", "Sees everything", "Full", "m")}
          {row(<FiLock />, "Front desk", "Members and fees only", "Limited")}
        </>
      );
  }
}

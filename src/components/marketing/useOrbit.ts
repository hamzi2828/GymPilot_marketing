"use client";

// The mechanics shared by the homepage's two sticky, scroll-driven 3D
// carousels (FeatureOrbit, "31 features in eight areas", and Benefits, "What
// changes for your gym"): scrolling through the section turns the carousel,
// the tabs at the bottom jump to a card, and a pill slides behind the active
// tab. Only for anyone who asks for less motion does it lay flat (`flat`): a
// swipeable row on phones or a grid on wider screens. The look is in
// OrbitStage.module.css.

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function useOrbit(count: number) {
  const last = Math.max(1, count - 1);
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

  // The scroll carousel renders by default (no layout jump on load); only
  // reduced motion switches to the flat layout after mount.
  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(rm.matches);
      setFlat(rm.matches);
    };
    update();
    rm.addEventListener("change", update);
    return () => rm.removeEventListener("change", update);
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
      tf = clamp(-sec.getBoundingClientRect().top / total(), 0, 1) * last;
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
  }, [flat, last]);

  // In the flat row (reduced motion on phones), the tab follows the card swiped into view.
  useEffect(() => {
    if (!flat) return;
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      if (track.scrollWidth <= track.clientWidth) return;
      const first = cardRefs.current[0];
      const second = cardRefs.current[1];
      const step = first && second ? second.offsetLeft - first.offsetLeft : track.clientWidth;
      setActive(clamp(Math.round(track.scrollLeft / Math.max(1, step)), 0, last));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [flat, last]);

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

  /** Scroll (or, when flat, swipe) to card `i`. */
  const goto = (i: number) => {
    const behavior: ScrollBehavior = reduced ? "instant" : "smooth";
    if (!flat) {
      const sec = sectionRef.current;
      if (!sec) return;
      const top = sec.getBoundingClientRect().top + window.scrollY;
      const total = Math.max(1, sec.offsetHeight - window.innerHeight);
      window.scrollTo({ top: top + (i / last) * total + 2, behavior });
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

  /** The ref callbacks for card, dim and tab `i`. */
  const cardRef = (i: number) => (el: HTMLElement | null) => {
    cardRefs.current[i] = el;
  };
  const dimRef = (i: number) => (el: HTMLSpanElement | null) => {
    dimRefs.current[i] = el;
  };
  const tabRef = (i: number) => (el: HTMLButtonElement | null) => {
    tabRefs.current[i] = el;
  };

  return { sectionRef, trackRef, tabsRef, pillRef, cardRef, dimRef, tabRef, flat, reduced, active, goto, steps: last };
}

/** The glow inside a card follows a mouse; touches are page scrolls, so skip the work. */
export function trackGlow(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

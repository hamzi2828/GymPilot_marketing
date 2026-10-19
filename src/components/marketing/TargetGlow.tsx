"use client";

// The glow on a feature card reached from Jump to or the Features menu
// (/features#<slug>, globals.css). CSS :target only follows a full page load:
// a <Link> moves with history.pushState, which leaves :target where it was.
// So the card is marked here as well -- on arriving at /features with a
// feature in the address, and on each click of a link to a card while here.

import { useEffect } from "react";

const LIT = "is-target";
// Long enough for the animation to play out (m-target-ring: 0.5s delay + 2.6s).
const GLOW_MS = 3200;

export default function TargetGlow() {
  useEffect(() => {
    let lit: HTMLElement | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const glow = (hash: string) => {
      let id = "";
      try {
        id = decodeURIComponent(hash.replace(/^#/, ""));
      } catch {
        return;
      }
      const card = id ? document.getElementById(id) : null;
      if (!card || !card.classList.contains("feature-anchor")) return;
      lit?.classList.remove(LIT);
      card.classList.remove(LIT);
      // Read a layout value so the same card picked twice plays the glow again.
      void card.offsetWidth;
      card.classList.add(LIT);
      lit = card;
      clearTimeout(timer);
      timer = setTimeout(() => card.classList.remove(LIT), GLOW_MS);
    };

    // Arrived by <Link> from another page (a full load has :target already).
    const frame = window.requestAnimationFrame(() => glow(window.location.hash));

    // A link to a card on this page: Jump to, or the header's Features menu.
    // A click that opens a new tab or window is that tab's business.
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank") return;
      const to = new URL(link.href, window.location.href);
      if (to.origin === window.location.origin && to.pathname === window.location.pathname && to.hash) glow(to.hash);
    };
    // The address edited by hand, or back and forward between cards.
    const onHash = () => glow(window.location.hash);

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.cancelAnimationFrame(frame);
      clearTimeout(timer);
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  return null;
}

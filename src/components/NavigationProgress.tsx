"use client";

// A slim bar across the top of the window while the next page loads, on the
// site and in the panel alike. Next.js says when a navigation starts (see
// instrumentation-client.ts); the new address arriving here says it is done.
// A page that is already there arrives before the bar is due and never shows
// it. For anyone who has asked for reduced motion it appears and goes
// without sliding (globals.css).

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NAVIGATION_START } from "@/lib/navigation";

// Only a navigation still going after this long shows the bar.
const SHOW_AFTER_MS = 120;
// A navigation that never changes the address (a redirect back to this very
// page) must not leave the bar on screen.
const GIVE_UP_AFTER_MS = 10000;
// Long enough for the bar to fill and fade (globals.css, .nav-progress).
const FADE_MS = 450;

type Phase = "idle" | "start" | "running" | "done";

export default function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // A navigation has started and its page has not arrived yet.
  const waiting = useRef(false);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  // Arrived, or given up on: a bar that is showing fills, then fades.
  const finish = useCallback(() => {
    waiting.current = false;
    clearTimers();
    setPhase((p) => (p === "idle" ? p : "done"));
    timers.current.push(setTimeout(() => setPhase("idle"), FADE_MS));
  }, [clearTimers]);

  useEffect(() => {
    const onStart = (event: Event) => {
      let to: URL;
      try {
        to = new URL((event as CustomEvent<string>).detail, window.location.href);
      } catch {
        return;
      }
      // Another site (the browser shows its own progress), or this same page
      // at a different #section: there is nothing to load.
      if (to.origin !== window.location.origin || (to.pathname === window.location.pathname && to.search === window.location.search)) return;
      clearTimers();
      waiting.current = true;
      timers.current.push(
        setTimeout(() => {
          setPhase((p) => (p === "running" ? p : "start"));
          // One frame at nothing, so the bar has somewhere to grow from.
          requestAnimationFrame(() => requestAnimationFrame(() => setPhase((p) => (p === "start" ? "running" : p))));
        }, SHOW_AFTER_MS),
        setTimeout(finish, GIVE_UP_AFTER_MS)
      );
    };
    // Brought back from the browser's back-forward cache: a bar that was
    // running when the page was left belongs to a navigation long finished.
    const onShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      waiting.current = false;
      clearTimers();
      setPhase("idle");
    };
    window.addEventListener(NAVIGATION_START, onStart);
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener(NAVIGATION_START, onStart);
      window.removeEventListener("pageshow", onShow);
      clearTimers();
    };
  }, [clearTimers, finish]);

  // The new page is here.
  useEffect(() => {
    if (waiting.current) finish();
  }, [pathname, search, finish]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5">
      <div data-phase={phase} className="nav-progress h-full bg-gradient-to-r from-brand-500 via-purple-500 to-fuchsia-500" />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa";
import { FiChevronDown, FiChevronRight, FiMenu, FiX } from "react-icons/fi";
import Brand from "./Brand";
import { CONTACT, NAV, SITE } from "@/content/site";
import { FEATURES } from "@/content/features";
import FeatureGroupsGrid from "./FeatureGroupsGrid";
import ViewAllFeaturesButton from "./ViewAllFeaturesButton";
import ThemeSwitch from "./ThemeSwitch";

// How far below the top of the viewport a section has to reach before the
// menu treats it as the current one (the header's own height plus a little).
const ACTIVE_OFFSET = 120;

type NavItem = (typeof NAV)[number];

/** The landing-page section that lights a menu item, if any. */
const spyOf = (item: NavItem) => item.spy ?? (item.href.startsWith("#") ? item.href : null);

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gp-mint focus-visible:ring-offset-2 focus-visible:ring-offset-gp-void";

// The reference's island pill links (.isl) and small buttons (.btn-sm).
const ISL = `inline-flex h-[34px] items-center gap-1.5 rounded-full px-[13px] text-sm transition-colors ${FOCUS}`;
const islLook = (on: boolean) => (on ? "bg-gp-bone/[0.08] text-gp-bone" : "text-gp-mist hover:bg-gp-bone/[0.06] hover:text-gp-bone");
const BTN_SM = `inline-flex h-[38px] items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-[15px] text-sm font-medium transition-[box-shadow,background-color,color,transform] duration-300 active:scale-[0.97] ${FOCUS}`;
const BTN_LIGHT = "gp-btn-light bg-gp-bone text-gp-ink";
const BTN_DARK = "gp-btn-dark border border-gp-edge-2 text-gp-bone";
const BTN_GHOST = "text-gp-mist hover:bg-gp-bone/5 hover:text-gp-bone";
// The island's glass, shared by the bar and the panels that open from it
// (globals.css: .gp-glass / .gp-glass-panel, with their light looks).
const GLASS = "gp-glass border border-gp-edge-2 backdrop-blur-md";
const PANEL = "gp-glass-panel border border-gp-edge-2 backdrop-blur-md";

/** Esc and a click or focus anywhere outside `wrap` close a disclosure. */
function useDismiss(open: boolean, close: (refocus: boolean) => void, wrap: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onPointer = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, close, wrap]);
}

/**
 * The Features menu on wide screens: the word takes you to the features on
 * the landing page (to /features, when on it), and the arrow beside it
 * opens a panel of every feature, by group, under the island. A disclosure
 * rather than an ARIA menu -- it is a set of links, so Tab walks through
 * them as on any page.
 * Enter, Space or Arrow Down opens it (Arrow Down also moves into it), Esc
 * closes it and hands focus back to the button, and it closes when focus or
 * a click lands anywhere else.
 */
function FeaturesMenu({ current, labelHref }: { current: boolean; labelHref: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const dismiss = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useDismiss(open, dismiss, wrap);

  const focusFirst = () => window.requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>("a")?.focus());

  return (
    <div
      ref={wrap}
      className="flex items-center"
      onBlur={(e) => {
        if (open && !wrap.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      {/* Two controls: the word is a link like the rest of the island, the
          chevron is its own small button that opens the list. */}
      <Link href={labelHref} onClick={() => setOpen(false)} aria-current={current ? "true" : undefined} className={`${ISL} pr-2 ${islLook(current)}`}>
        Features
      </Link>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Hide the list of features" : "Show the list of features"}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            focusFirst();
          }
        }}
        title="Show all features"
        className={`-ml-1 inline-flex h-[34px] w-8 items-center justify-center rounded-full transition-colors ${FOCUS} ${islLook(open)}`}
      >
        <FiChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {/* Hangs under the island, as wide as the page allows. */}
      <div ref={panel} id={panelId} hidden={!open} className={`a-menu fixed inset-x-4 top-[78px] mx-auto max-h-[calc(100vh-96px)] max-w-[1100px] overflow-y-auto overscroll-contain rounded-[26px] ${PANEL}`}>
        <div className="px-7 py-7">
          <p className="mb-1 px-1 text-[19px] font-medium tracking-[-0.01em] text-gp-bone">
            Every feature <span className="text-gp-slate">by area</span>
          </p>
          <p className="mb-6 px-1 text-[13px] text-gp-slate">Pick one to jump to it on the features page.</p>
          <FeatureGroupsGrid onNavigate={() => setOpen(false)} currentPath={pathname} />

          <div className="mt-7 flex items-center justify-between gap-6 border-t border-gp-edge pt-5">
            <p className="text-sm text-gp-slate">Everything here is in every plan, except the native member app: that is the one add-on.</p>
            <ViewAllFeaturesButton count={FEATURES.length} onClick={() => setOpen(false)} className="shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Sign in, from the reference's header. A gym signs in on its own website,
 * not here, so this opens a short note saying so rather than a login page;
 * the platform's own sign-in stays one quiet link in the footer.
 */
function SignIn() {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const pathname = usePathname();
  const dismiss = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useDismiss(open, dismiss, wrap);

  return (
    <div
      ref={wrap}
      className="relative"
      onBlur={(e) => {
        if (open && !wrap.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button ref={button} type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className={`${BTN_SM} ${BTN_GHOST} ${open ? "bg-gp-bone/5 text-gp-bone" : ""}`}>
        Sign in
      </button>
      <div id={id} hidden={!open} className={`a-menu absolute right-0 top-[calc(100%+10px)] w-72 rounded-2xl p-4 text-left ${PANEL}`}>
        <p className="text-sm leading-relaxed text-gp-mist">{CONTACT.existing}</p>
        <Link href="/contact" onClick={() => setOpen(false)} className={`mt-3 inline-flex items-center gap-1 text-sm font-medium text-gp-mint hover:text-gp-bone ${FOCUS} rounded`}>
          Help signing in <FiChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  // The menu's "#…" targets are sections of the landing page. From anywhere
  // else they have to carry the "/" so they still lead somewhere.
  const onLanding = pathname === "/";
  const href = (target: string) => (target.startsWith("#") && !onLanding ? `/${target}` : target);
  const onFeatures = pathname === "/features" || pathname.startsWith("/features/");
  // Features is lit under /features, so there it leads to /features itself,
  // not back to the landing page's features section.
  const featuresHref = onFeatures ? "/features" : href("#areas");

  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const mobileFeaturesId = useId();
  const mobileMenuId = useId();

  // Scroll-spy: the menu item for the section currently on screen is lit.
  useEffect(() => {
    const ids = onLanding ? NAV.map(spyOf).filter((h): h is string => !!h).map((h) => h.slice(1)) : [];
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = `#${id}`;
      }
      // At the very bottom the last section counts even if it is short.
      if (ids.length && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = `#${ids[ids.length - 1]}`;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [onLanding]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
    setFeaturesOpen(false);
  }, [pathname]);

  // Features is lit anywhere under /features, and over its landing section.
  const isActive = (item: NavItem) => (item.menu === "features" && onFeatures) || (onLanding && !!spyOf(item) && active === spyOf(item));
  const close = () => setOpen(false);

  return (
    // The top strip fades from the page colour so content scrolls away under
    // it; only its controls take clicks. `gp-site` switches the page to the
    // site look.
    <header className="gp-site gp-top-fade pointer-events-none fixed inset-x-0 top-0 z-50 h-[calc(84px+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] font-gp">
      <div className="flex h-[84px] items-center justify-between gap-3 px-4 sm:px-7">
        <Brand className="pointer-events-auto shrink-0" />

        <div className="pointer-events-auto flex items-center gap-1.5">
          {SITE.whatsappUrl && (
            <a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Message us on WhatsApp" title="Message us on WhatsApp" className={`${BTN_SM} ${BTN_GHOST} hidden w-[38px] px-0 lg:inline-flex`}>
              <FaWhatsapp className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
          {/* The barbell theme switch; on phones it is in the menu instead. */}
          <ThemeSwitch className="mr-1.5 hidden sm:block" />
          <div className="hidden lg:block">
            <SignIn />
          </div>
          <Link href={href("#demo")} className={`${BTN_SM} ${BTN_LIGHT} hidden sm:inline-flex`}>
            Book a demo
          </Link>
          {/* Below lg the island folds to this one Menu pill. */}
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={mobileMenuId} aria-label={open ? "Close menu" : "Open menu"} className={`${ISL} h-[38px] border border-gp-edge-2 lg:hidden ${GLASS} ${open ? "text-gp-bone" : "text-gp-mist"}`}>
            {open ? <FiX className="h-4 w-4" aria-hidden="true" /> : <FiMenu className="h-4 w-4" aria-hidden="true" />} Menu
          </button>
        </div>
      </div>

      {/* The floating island, centred over the page on wide screens. */}
      {/* Centred with auto margins, not a transform, and the glass is a layer
          of its own: a transform or backdrop-filter on the bar would trap the
          Features panel (position: fixed) inside it. */}
      <nav aria-label="Primary" className="pointer-events-auto absolute inset-x-0 top-[calc(18px+env(safe-area-inset-top,0px))] isolate mx-auto hidden h-12 w-fit items-center gap-0.5 whitespace-nowrap px-1.5 lg:flex">
        <span className={`pointer-events-none absolute inset-0 -z-10 rounded-3xl ${GLASS}`} aria-hidden="true" />
        {NAV.map((item) => {
          const current = isActive(item);
          if (item.menu === "features") return <FeaturesMenu key={item.href} current={current} labelHref={featuresHref} />;
          return (
            <Link key={item.href} href={href(item.href)} aria-current={current ? "true" : undefined} className={`${ISL} ${islLook(current)}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {open && (
        <div id={mobileMenuId} className={`a-menu pointer-events-auto fixed inset-x-3 top-[calc(76px+env(safe-area-inset-top,0px))] max-h-[calc(100dvh-92px-env(safe-area-inset-top,0px))] overflow-y-auto overscroll-contain rounded-[26px] p-4 lg:hidden ${PANEL}`}>
          <nav className="flex flex-wrap gap-1" aria-label="Mobile">
            {NAV.filter((item) => item.menu !== "features").map((item) => {
              const current = isActive(item);
              return (
                <Link key={item.href} href={href(item.href)} onClick={close} aria-current={current ? "true" : undefined} className={`${ISL} ${current ? "bg-gp-bone/[0.08] text-gp-bone" : "bg-gp-bone/[0.04] text-gp-mist hover:bg-gp-bone/[0.08] hover:text-gp-bone"}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {NAV.filter((item) => item.menu === "features").map((item) => (
            <div key={item.href} className="mt-4 border-t border-gp-edge pt-3">
              <div className="flex items-center gap-2">
                <Link href={featuresHref} onClick={close} className={`flex-1 rounded-xl px-2 py-2.5 text-[17px] font-medium tracking-[-0.01em] ${FOCUS} ${isActive(item) ? "text-gp-bone" : "text-gp-bone/90 hover:text-gp-bone"}`}>
                  Features <span className="text-gp-slate">by area</span>
                </Link>
                <button
                  type="button"
                  aria-expanded={featuresOpen}
                  aria-controls={mobileFeaturesId}
                  aria-label={featuresOpen ? "Hide the list of features" : "Show the list of features"}
                  onClick={() => setFeaturesOpen((o) => !o)}
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gp-edge transition-colors ${FOCUS} ${featuresOpen ? "bg-gp-bone/[0.08] text-gp-bone" : "bg-gp-bone/[0.04] text-gp-mist hover:bg-gp-bone/[0.08]"}`}
                >
                  <FiChevronDown className={`h-5 w-5 transition-transform duration-300 motion-reduce:transition-none ${featuresOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
              </div>
              <div id={mobileFeaturesId} hidden={!featuresOpen} className="a-menu mb-2 mt-2">
                <ViewAllFeaturesButton count={FEATURES.length} onClick={close} aria-current={pathname === "/features" ? "page" : undefined} className="w-full" />
                <FeatureGroupsGrid onNavigate={close} currentPath={pathname} className="mt-5 pl-1" />
              </div>
            </div>
          ))}

          <div className="mt-3 flex flex-col gap-2 border-t border-gp-edge pt-4">
            <Link href={href("#demo")} onClick={close} className={`${BTN_SM} ${BTN_LIGHT} h-11 rounded-xl`}>
              Book a demo <FiChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {SITE.whatsappUrl && (
              <a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" className={`${BTN_SM} ${BTN_DARK} h-11 rounded-xl`}>
                <FaWhatsapp className="h-4 w-4 text-gp-mint" aria-hidden="true" /> Message us on WhatsApp
              </a>
            )}
            <Link href="/contact" onClick={close} className={`${BTN_SM} ${BTN_GHOST} h-11 rounded-xl border border-gp-edge`}>
              Contact us
            </Link>
            {/* No sign-in here: a gym signs in on its own website, and the
                platform's own sign-in is one quiet link in the footer. */}
            <p className="px-1 pt-1 text-center text-xs leading-relaxed text-gp-slate">{CONTACT.existing}</p>
          </div>

          {/* Phones have no room for the switch in the bar (reference .ip-theme). */}
          <div className="mt-4 flex items-center gap-2.5 border-t border-gp-edge pt-4 text-[13px] text-gp-slate sm:hidden">
            <ThemeSwitch />
            <span>Light mode</span>
          </div>
        </div>
      )}
    </header>
  );
}

"use client";

// "31 features in eight areas": a sticky, scroll-driven 3D carousel. Two
// outcome cards come first (get paid with no unpaid visits, and win members
// back, each with its scene), then one card per feature area. Scrolling through the section turns the carousel;
// the tabs at the bottom jump to an area (the mechanics are useOrbit.ts and
// OrbitStage.module.css, shared with Benefits). Phones get the same pinned, scrolling
// carousel, sized as the reference sizes it at <=640px. Only for
// anyone who asks for less motion does it lay flat: a swipeable row on phones
// or a grid on wider screens.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { FiChevronRight, FiLock } from "react-icons/fi";
import { LuCrown, LuFingerprint } from "react-icons/lu";
import { FEATURE_GROUPS, FEATURES, featureByKey, featuresIn, type FeatureKey, type GroupKey } from "@/content/features";
import { BENEFITS } from "@/content/site";
import { FEATURE_ICONS } from "./featureIcons";
import { BENEFIT_SCENES } from "./BenefitScenes";
import sc from "./OrbitScene.module.css";
import { AREA_ICONS, featuresLabel, numberWord, shortLabel, tintVars } from "./featureAreas";
import ViewAllFeaturesButton from "./ViewAllFeaturesButton";
import { trackGlow, useOrbit } from "./useOrbit";
import o from "./OrbitStage.module.css";
import s from "./FeatureOrbit.module.css";

const AREAS = FEATURE_GROUPS.map((g) => ({ ...g, count: featuresIn(g.key).length }));
const areaHref = (key: GroupKey) => `/features#${key}`;

// The owner's outcome cards go first, then one card per area. "Get paid on
// time" and "No more unpaid visits" share one card, and "Know your numbers"
// is the Money & reports card (the owner's calls).
const BENEFIT_TINTS = [
  { "--tint-d": "#7FE3D2", "--tint-l": "#0B7566" },
  { "--tint-d": "#E5A34A", "--tint-l": "#8F5609" },
];
// Classes & PT and Staff & trainers share one card here (the owner's call);
// it opens the Classes area on /features. The /features page keeps both.
const teamCount = AREAS.find((a) => a.key === "team")?.count ?? 0;
const CAROUSEL_AREAS = AREAS.filter((a) => a.key !== "team").map((a) =>
  a.key === "classes"
    ? {
        ...a,
        label: "Classes, PT & staff",
        title: "Classes, trainers and staff",
        text: "Your timetable and trainers' diaries with members booking themselves in, plus rotas, leave and payslips for the team.",
        count: a.count + teamCount,
      }
    : a
);
const benefit = (k: FeatureKey) => BENEFITS.items.find((x) => x.key === k)!;
const OUTCOMES: { key: FeatureKey; title: string; text: string; tab: string }[] = [
  {
    key: "renewals",
    title: "Get paid on time, no unpaid visits",
    text: "See who owes and get paid online or by bank transfer. The desk hears “Fee expired” at the door.",
    tab: "Get paid",
  },
  { key: "messaging", title: benefit("messaging").title, text: benefit("messaging").text, tab: "Win back" },
];
const BENEFIT_KEYS = OUTCOMES.map((x) => x.key);
type Card =
  | { kind: "benefit"; key: FeatureKey; title: string; text: string; tab: string; href: string }
  | { kind: "area"; area: (typeof AREAS)[number]; href: string };
const CARDS: Card[] = [
  ...OUTCOMES.map((x) => ({ kind: "benefit" as const, ...x, href: `/features#${featureByKey(x.key).slug}` })),
  ...CAROUSEL_AREAS.map((a) => ({ kind: "area" as const, area: a, href: areaHref(a.key) })),
];

export default function FeatureOrbit() {
  const router = useRouter();
  const { sectionRef, trackRef, tabsRef, pillRef, cardRef, dimRef, tabRef, flat, active, goto, steps } = useOrbit(CARDS.length);

  // Any card, front or side, opens its page (the owner's call).
  const open = (i: number) => {
    router.push(CARDS[i].href);
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

  return (
    <section ref={sectionRef} id="areas" aria-labelledby="areas-title" className={`${o.orbit} ${flat ? o.flat : ""}`} style={{ "--steps": steps } as CSSProperties}>
      <div className={o.stage}>
        <div className={o.head}>
          {/* The owner wanted the "View all features" button here instead of a
              visible heading; the heading stays for screen readers. */}
          <h2 id="areas-title" className="sr-only">
            {FEATURES.length} features in {numberWord(AREAS.length)} areas
          </h2>
          <ViewAllFeaturesButton size="lg" count={FEATURES.length} />
        </div>

        <div ref={trackRef} className={o.track}>
          {CARDS.map((c, i) => {
            if (c.kind === "benefit") {
              const Icon = FEATURE_ICONS[c.key];
              const Scene = BENEFIT_SCENES[c.key];
              const feature = featureByKey(c.key);
              const bi = BENEFIT_KEYS.indexOf(c.key);
              return (
                <article
                  key={`b-${c.key}`}
                  ref={cardRef(i)}
                  className={`${o.card} ${sc.card} ${i === active ? sc.live : ""}`}
                  style={BENEFIT_TINTS[bi % 2] as CSSProperties}
                  tabIndex={0}
                  role="button"
                  aria-label={`${c.title}: ${c.text}`}
                  onClick={onCardClick(i)}
                  onKeyDown={onCardKey(i)}
                  onPointerMove={trackGlow}
                >
                  <div className={o.top}>
                    <span>{feature.name}</span>
                    <span className={o.icon} aria-hidden>
                      <Icon />
                    </span>
                  </div>
                  <h3>{c.title}</h3>
                  <p className={o.intro}>{c.text}</p>
                  {Scene && (
                    <div className={`${o.vig} ${sc.vig}`} aria-hidden>
                      <div className={sc.scene}>
                        <Scene />
                      </div>
                    </div>
                  )}
                  <div className={o.foot}>
                    <span>See how it works</span>
                    <Link href={c.href} className={o.go} tabIndex={-1}>
                      Open <FiChevronRight aria-hidden />
                    </Link>
                  </div>
                  <span className={o.dim} ref={dimRef(i)} />
                </article>
              );
            }
            const a = c.area;
            const Icon = AREA_ICONS[a.key];
            return (
              <article
                key={a.key}
                ref={cardRef(i)}
                className={`${o.card} ${i === active ? s.live : ""}`}
                style={tintVars(a.key) as CSSProperties}
                tabIndex={0}
                role="button"
                aria-label={`${a.label}, ${featuresLabel(a.count)}`}
                onClick={onCardClick(i)}
                onKeyDown={onCardKey(i)}
                onPointerMove={trackGlow}
              >
                <div className={o.top}>
                  <span>{a.label}</span>
                  <span className={o.icon} aria-hidden>
                    <Icon />
                  </span>
                </div>
                <h3>{a.title}</h3>
                <p className={o.intro}>{a.text}</p>
                <div className={o.vig} aria-hidden>
                  <Vignette area={a.key} />
                </div>
                <div className={o.foot}>
                  <span>{featuresLabel(a.count)}</span>
                  <Link href={c.href} className={o.go} tabIndex={-1}>
                    Open <FiChevronRight aria-hidden />
                  </Link>
                </div>
                <span className={o.dim} ref={dimRef(i)} />
              </article>
            );
          })}
        </div>

        <div ref={tabsRef} className={o.tabs} role="tablist" aria-label="What it does and the feature areas">
          <span ref={pillRef} className={o.pill} aria-hidden />
          {CARDS.map((c, i) => (
            <button
              key={c.kind === "benefit" ? `b-${c.key}` : c.area.key}
              ref={tabRef(i)}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`${o.tab} ${i === active ? o.tabOn : ""}`}
              onClick={() => goto(i)}
            >
              <span>{c.kind === "benefit" ? c.tab : shortLabel(c.area.label)}</span>
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

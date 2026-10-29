"use client";

// What a gym owner gets out of it: six outcomes, each acted out in a small
// scene. The same sticky, scroll-driven 3D carousel as "31 features in eight
// areas" (useOrbit.ts and OrbitStage.module.css): scrolling turns the cards,
// the tabs at the bottom jump to one, and the front card plays its scene.
// Phones get the same pinned carousel; only for anyone who asks for less
// motion does it lay flat (a grid, or a swipeable row on phones).
// The hero's "See how it helps" lands here (#helps).

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { FiChevronRight } from "react-icons/fi";
import { BENEFITS } from "@/content/site";
import { featureByKey, featureHref } from "@/content/features";
import { FEATURE_ICONS } from "./featureIcons";
import { BENEFIT_SCENES } from "./BenefitScenes";
import { trackGlow, useOrbit } from "./useOrbit";
import o from "./OrbitStage.module.css";
import b from "./Benefits.module.css";

// Mint and amber in turn (the pairs FeatureOrbit uses for its first two areas).
const TINTS = [
  { "--tint-d": "#7FE3D2", "--tint-l": "#0B7566" },
  { "--tint-d": "#E5A34A", "--tint-l": "#8F5609" },
];

const ITEMS = BENEFITS.items;

export default function Benefits() {
  const router = useRouter();
  const { sectionRef, trackRef, tabsRef, pillRef, cardRef, dimRef, tabRef, flat, active, goto, steps } = useOrbit(ITEMS.length);

  // A side card turns to the front; the front card opens its feature.
  const open = (i: number) => {
    if (!flat && i !== active) goto(i);
    else router.push(featureHref(ITEMS[i].key));
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
    <section
      ref={sectionRef}
      id="helps"
      aria-labelledby="helps-title"
      className={`${o.orbit} ${b.root} ${flat ? `${o.flat} ${b.isFlat}` : ""}`}
      style={{ "--steps": steps } as CSSProperties}
    >
      <div className={`${o.stage} ${b.stage}`}>
        <div className={`${o.head} ${b.head}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gp-mint">{BENEFITS.eyebrow}</p>
          <h2 id="helps-title" className={`${b.title} gp-shine mt-2 font-gp font-semibold tracking-[-0.02em] sm:mt-3`}>
            {BENEFITS.title}
          </h2>
          <span className="mx-auto mt-4 hidden h-1 w-12 rounded-full bg-gradient-to-r from-gp-mint to-gp-ember sm:block" aria-hidden="true" />
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-gp-mist sm:mt-4 sm:text-lg">{BENEFITS.text}</p>
        </div>

        <div ref={trackRef} className={`${o.track} ${b.track}`}>
          {ITEMS.map((item, i) => {
            const Icon = FEATURE_ICONS[item.key];
            const Scene = BENEFIT_SCENES[item.key];
            const feature = featureByKey(item.key);
            return (
              <article
                key={item.key}
                ref={cardRef(i)}
                className={`${o.card} ${b.card} ${i === active ? b.live : ""}`}
                style={TINTS[i % 2] as CSSProperties}
                tabIndex={0}
                role="button"
                aria-label={`${item.title}: ${item.text}`}
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
                <h3>{item.title}</h3>
                <p className={o.intro}>{item.text}</p>
                {Scene && (
                  <div className={`${o.vig} ${b.vig}`} aria-hidden>
                    <div className={b.scene}>
                      <Scene />
                    </div>
                  </div>
                )}
                <div className={`${o.foot} ${b.foot}`}>
                  <span>
                    {i + 1} of {ITEMS.length}
                  </span>
                  <Link href={featureHref(item.key)} className={o.go} tabIndex={-1}>
                    Open <FiChevronRight aria-hidden />
                  </Link>
                </div>
                <span className={o.dim} ref={dimRef(i)} />
              </article>
            );
          })}
        </div>

        <div ref={tabsRef} className={o.tabs} role="tablist" aria-label="What changes">
          <span ref={pillRef} className={o.pill} aria-hidden />
          {ITEMS.map((item, i) => (
            <button
              key={item.key}
              ref={tabRef(i)}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`${o.tab} ${i === active ? o.tabOn : ""}`}
              onClick={() => goto(i)}
            >
              <span>{item.tab}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

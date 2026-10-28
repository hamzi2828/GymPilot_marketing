"use client";

// The pricing section's "Included in every plan" card, ported from the
// reference: two tilted columns of feature tiles drift past each side (in
// opposite directions, looping), a soft fade keeps the middle readable, and
// the card carries its own Dark/Light switch that flips only the card. The
// card starts in the site's theme and follows it when the site theme changes;
// the switch overrides it until then. The tiles are decoration, hidden from
// screen readers, and hold still for anyone who has asked for reduced motion.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronRight } from "react-icons/fi";
import { FEATURES, featureHref, type Feature, type FeatureKey } from "@/content/features";
import { FEATURE_ICONS } from "./featureIcons";
import { useLightTheme } from "./ThemeSwitch";
import s from "./IncludedCard.module.css";

const INCLUDED: { key: FeatureKey; label: string }[] = [
  { key: "website", label: "Your own website and web address" },
  { key: "feedesk", label: "Fee collection and dues lists" },
  { key: "alerts", label: "Check-in with spoken fee alerts" },
  { key: "booking", label: "Class and PT booking" },
  { key: "billing", label: "Fee reminders with a link to pay online" },
  { key: "dailysales", label: "Daily sales and profit and loss" },
];

// Four columns, dealt round-robin like the reference; each runs at its own pace.
const CHUNKS: Feature[][] = [[], [], [], []];
FEATURES.forEach((f, i) => CHUNKS[i % 4].push(f));
const COLS: { side: 0 | 1; down: boolean; dur: number }[] = [
  { side: 0, down: false, dur: 42 },
  { side: 0, down: true, dur: 50 },
  { side: 1, down: true, dur: 46 },
  { side: 1, down: false, dur: 54 },
];

function Tile({ f }: { f: Feature }) {
  const Icon = FEATURE_ICONS[f.key];
  return (
    <div className={s.tile}>
      <span className={s.ic}>
        <Icon />
      </span>
      {f.name}
    </div>
  );
}

function Column({ i }: { i: number }) {
  const { down, dur } = COLS[i];
  const items = CHUNKS[i];
  return (
    <div className={`${s.col} ${down ? s.down : ""}`} style={{ animationDuration: `${dur}s` }}>
      {items.map((f) => (
        <Tile key={f.key} f={f} />
      ))}
      {items.map((f) => (
        <Tile key={`${f.key}-2`} f={f} />
      ))}
    </div>
  );
}

export default function IncludedCard() {
  const siteLight = useLightTheme();
  // The switch's choice, remembered only for the site theme it was made in.
  const [choice, setChoice] = useState<{ site: boolean; light: boolean } | null>(null);
  const light = choice && choice.site === siteLight ? choice.light : siteLight;

  const card = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = card.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([en]) => setLive(en.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div>
      <div className={s.toggleWrap}>
        <div className={s.toggle}>
          Dark
          <button
            type="button"
            className={s.sw}
            role="switch"
            aria-checked={light}
            aria-label="Show the card in light mode"
            onClick={() => setChoice({ site: siteLight, light: !light })}
          />
          Light
        </div>
      </div>

      <div ref={card} className={`${s.pcard} ${light ? s.light : ""} ${live ? s.live : ""}`}>
        <div className={s.cols} aria-hidden="true">
          {[0, 1].map((side) => (
            <div key={side} className={s.side}>
              {COLS.map((c, i) => (c.side === side ? <Column key={i} i={i} /> : null))}
            </div>
          ))}
        </div>
        <div className={s.fade} aria-hidden="true" />
        <div className={s.body}>
          <div className={s.k}>Included in every plan</div>
          <h3 className={s.h}>All {FEATURES.length} features</h3>
          <ul className={s.incl}>
            {INCLUDED.map(({ key, label }) => (
              <li key={key}>
                <FiCheck aria-hidden="true" />
                <Link href={featureHref(key)}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className={s.btns}>
            <Link href="/features" className={s.btn}>
              See every feature <FiChevronRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

// Plans come from the platform's own price list (the super admin edits them
// in the panel), so the website never disagrees with what a gym is charged.

import { useEffect, useState } from "react";
import Link from "next/link";
import IncludedCard from "./IncludedCard";
import { FiArrowRight, FiCheck, FiPlus, FiRefreshCw, FiSmartphone } from "react-icons/fi";
import { PRICING } from "@/content/site";
import { formatMoney, publicFetch, recommendedPlanIndex, yearlySaving, type PublicAddon, type PublicPlan } from "@/lib/api";
import { stagger } from "@/lib/motion";
import SectionHeading from "./SectionHeading";

// A sleeping API answers on the second or third knock: the prices are asked
// for again after each of these waits before the page admits it has none.
const RETRY_AFTER_MS = [2000, 5000, 10000];

// The limit boxes already show members, staff, trainers and classes, so the
// plan's own lines saying the same ("Up to 150 members", "3 staff, 3 trainers,
// 15 classes a week") are left out of its feature list here.
const repeatsLimits = (f: string) => /^up to [\d,]+ members$/i.test(f.trim()) || /\bstaff\b.*\btrainers?\b/i.test(f);

function limit(n: number) {
  return n ? n.toLocaleString() : "Unlimited";
}

/** A face for an add-on. Anything we have no icon for gets a plus. */
function addonIcon(slug: string) {
  if (slug.includes("app")) return FiSmartphone;
  return FiPlus;
}

/**
 * An add-on on a plan card. The same tile whether it is being sold or given
 * away -- a plan that includes it should look like it won something, not like
 * it is missing a box the others have.
 */
function AddonTile({
  addon,
  included,
  isPopular,
  yearly,
}: {
  addon: PublicAddon;
  included: boolean;
  isPopular: boolean;
  yearly: boolean;
}) {
  const Icon = addonIcon(addon.slug);
  const perMonth = yearly && addon.price.yearly > 0 ? addon.price.yearly / 12 : addon.price.monthly;

  return (
    <div
      className={`edge-glow group/addon relative overflow-hidden rounded-2xl p-3.5 transition-transform duration-300 hover:-translate-y-0.5 ${
        isPopular ? "bg-gp-bone/[0.07]" : included ? "bg-gradient-to-br from-gp-mint/[0.12] to-gp-mint/[0.04]" : "bg-gradient-to-br from-gp-ember/[0.12] to-gp-ember/[0.04]"
      } ${included ? "edge-glow-free" : ""}`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover/addon:-rotate-6 group-hover/addon:scale-110 ${
            isPopular ? "bg-gp-bone/10 text-gp-bone" : included ? "bg-gp-panel text-gp-mint shadow-card" : "bg-gp-panel text-gp-ember shadow-card"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <p className="min-w-0 flex-1 text-sm font-bold leading-tight text-gp-bone">{addon.name}</p>
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] ${
            isPopular ? "bg-gp-bone/10 text-gp-mist" : included ? "bg-gp-mint text-gp-ink" : "bg-gp-panel/80 text-gp-ember"
          }`}
        >
          {included ? "Included" : "Add-on"}
        </span>
      </div>

      {addon.description && (
        <p className={`mt-2 line-clamp-2 text-xs leading-snug ${isPopular ? "text-gp-slate" : "text-gp-mist"}`}>{addon.description}</p>
      )}

      <p className="mt-2.5 flex flex-wrap items-baseline gap-x-1.5">
        {included ? (
          <>
            <span className={`font-gp text-xl font-extrabold tracking-tight ${isPopular ? "text-gp-bone" : "text-gp-mint"}`}>Free</span>
            <span className="text-xs text-gp-slate">
              on this plan · normally{" "}
              <span className="line-through">{formatMoney(perMonth, addon.price.currency)}</span>
            </span>
          </>
        ) : (
          <>
            <span className="font-gp text-xl font-extrabold tracking-tight text-gp-bone">
              +{formatMoney(perMonth, addon.price.currency)}
            </span>
            <span className="text-xs text-gp-slate">/ month</span>
          </>
        )}
      </p>
    </div>
  );
}

export default function Pricing() {
  const [plans, setPlans] = useState<PublicPlan[] | null>(null);
  const [addons, setAddons] = useState<PublicAddon[]>([]);
  const [failed, setFailed] = useState(false);
  const [yearly, setYearly] = useState(false);
  // Bumped by "Try again": the effect below starts over.
  const [round, setRound] = useState(0);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let tries = 0;

    const loadPlans = () => {
      publicFetch<{ data: PublicPlan[] }>("/plans")
        .then((res) => {
          if (!stopped) setPlans(res.data);
        })
        .catch(() => {
          if (stopped) return;
          const wait = RETRY_AFTER_MS[tries++];
          if (wait === undefined) setFailed(true);
          else timer = setTimeout(loadPlans, wait);
        });
    };
    loadPlans();
    // Add-ons are a bonus on the card: if this call fails the prices still
    // render, they just do not mention the extras.
    publicFetch<{ data: PublicAddon[] }>("/addons")
      .then((res) => {
        if (!stopped) setAddons(res.data);
      })
      .catch(() => {
        if (!stopped) setAddons([]);
      });

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [round]);

  const retry = () => {
    setFailed(false);
    setPlans(null);
    setRound((n) => n + 1);
  };

  /** The add-ons a plan hands over for nothing. */
  const includedFor = (plan: PublicPlan) =>
    (plan.includedAddons || []).map((slug) => addons.find((a) => a.slug === slug)).filter((a): a is PublicAddon => !!a);

  // What a plan can be sold on top of it: not what it already comes with,
  // only where the add-on is offered, and only in the plan's own currency --
  // a PKR add-on cannot go on a USD bill.
  const sellableFor = (plan: PublicPlan) =>
    addons.filter(
      (addon) =>
        !(plan.includedAddons || []).includes(addon.slug) &&
        (!addon.planSlugs.length || addon.planSlugs.includes(plan.slug)) &&
        addon.price.currency === plan.price.currency
    );

  // The one we point at (checkout starts on the same one).
  const recommended = recommendedPlanIndex(plans || []);
  const anyYearly = !!plans?.some((p) => p.price.yearly > 0);
  // The toggle promises only what the prices actually give.
  const bestSaving = plans ? Math.max(0, ...plans.map((p) => yearlySaving(p.price))) : 0;

  return (
    <section id="pricing" className="relative bg-gp-graphite py-24 sm:py-28">
      <div className="bg-grid-dark absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_60%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading eyebrow={PRICING.eyebrow} title={PRICING.title} text={PRICING.text} />

        {anyYearly && (
          <div className="a-rise mt-10 flex justify-center">
            <div className="inline-flex items-center rounded-full border border-gp-edge-2 bg-gp-panel p-1 text-sm shadow-card" role="group" aria-label="Billing period">
              {[
                ["monthly", "Monthly"],
                ["yearly", "Yearly"],
              ].map(([key, label]) => {
                const active = (key === "yearly") === yearly;
                return (
                  <button key={key} type="button" onClick={() => setYearly(key === "yearly")} aria-pressed={active} className={`rounded-full px-4 py-1.5 font-semibold transition-all duration-300 ${active ? "bg-gp-bone text-gp-ink shadow" : "text-gp-mist hover:text-gp-bone"}`}>
                    {label}
                    {key === "yearly" && bestSaving > 0 && (
                      <span className={`ml-1.5 text-[11px] ${active ? "text-gp-ink/70" : "text-gp-mint"}`}>save up to {bestSaving}%</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-12">
          {plans === null && !failed && (
            <div className="grid gap-5 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[420px] animate-pulse rounded-3xl border border-gp-edge-2 bg-gp-panel" />
              ))}
            </div>
          )}

          {/* The prices would not load: say so, and offer another go. */}
          {failed && (
            <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-gp-edge-2 bg-gp-panel p-10 text-center" role="status">
              <p className="text-base text-gp-mist">{PRICING.unavailable}</p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button type="button" onClick={retry} className="btn-shine inline-flex h-11 items-center gap-2 rounded-full bg-gp-bone px-6 text-sm font-semibold text-gp-ink">
                  <FiRefreshCw className="h-4 w-4" /> Try again
                </button>
                <a href="#demo" className="inline-flex h-11 items-center gap-2 rounded-full border border-gp-edge-2 px-6 text-sm font-semibold text-gp-mist hover:border-gp-bone/40">
                  Ask us for the prices <FiArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

          {/* Loaded, and there is nothing on sale yet. */}
          {!failed && plans && plans.length === 0 && (
            <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-gp-edge-2 bg-gp-panel p-10 text-center">
              <p className="text-base text-gp-mist">{PRICING.fallback}</p>
              <a href="#demo" className="btn-shine mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-gp-bone px-6 text-sm font-semibold text-gp-ink">
                Book a demo <FiArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}

          {plans && plans.length > 0 && (
            <div
              className={`grid gap-5 ${
                plans.length === 1
                  ? "mx-auto max-w-md"
                  : plans.length === 2
                  ? "mx-auto max-w-4xl md:grid-cols-2"
                  : plans.length === 3
                  ? "md:grid-cols-2 xl:grid-cols-3"
                  : "md:grid-cols-2 xl:grid-cols-4"
              }`}
            >
              {plans.map((plan, i) => {
                const isPopular = i === recommended;
                const perMonth = yearly && plan.price.yearly > 0 ? plan.price.yearly / 12 : plan.price.monthly;
                const saving = yearlySaving(plan.price);
                // Yearly only where the plan has a yearly price; a monthly-only
                // plan goes to checkout monthly whatever the toggle says.
                const cycle = yearly && plan.price.yearly > 0 ? "yearly" : "monthly";
                return (
                  <article key={plan.id} className={`a-rise relative flex flex-col rounded-3xl border p-7 transition-transform duration-300 hover:-translate-y-1 ${isPopular ? "border-gp-mint/60 bg-gp-raised text-gp-bone shadow-[0_0_0_1px_rgb(var(--gp-mint)/0.25),0_20px_60px_-20px_rgb(var(--gp-mint)/0.45)]" : "border-gp-edge-2 bg-gp-panel text-gp-bone shadow-card hover:shadow-lift"}`} style={stagger(i * 2)}>
                    {isPopular && <span className="absolute -top-3 left-7 animate-pulse-soft rounded-full bg-gradient-to-r from-gp-mint to-gp-ember px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gp-ink">Recommended</span>}
                    <h3 className="font-gp text-xl font-semibold">{plan.name}</h3>
                    {plan.description && <p className={`mt-1.5 text-sm ${isPopular ? "text-gp-mist" : "text-gp-slate"}`}>{plan.description}</p>}
                    <p key={yearly ? "yearly" : "monthly"} className="a-pop mt-6 flex origin-left items-baseline gap-1.5">
                      <span className="font-gp text-4xl font-extrabold tracking-tight">{perMonth === 0 ? "Free" : formatMoney(perMonth, plan.price.currency)}</span>
                      {perMonth > 0 && <span className="text-sm text-gp-slate">/ month</span>}
                    </p>
                    <p className="mt-1 text-xs text-gp-slate">
                      {yearly && plan.price.yearly > 0 ? `${formatMoney(plan.price.yearly, plan.price.currency)} billed yearly${saving > 0 ? ` · save ${saving}%` : ""}` : plan.price.yearly > 0 ? `or ${formatMoney(plan.price.yearly, plan.price.currency)} / year` : "billed monthly"}
                      {plan.trialDays > 0 ? ` · ${plan.trialDays}-day free trial` : ""}
                    </p>

                    <Link
                      href={`/checkout?plan=${plan.slug}&cycle=${cycle}`}
                      className={`btn-shine mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-transform hover:-translate-y-0.5 ${isPopular ? "btn-shine-dark bg-gp-bone text-gp-ink" : "bg-gp-bone/[0.08] text-gp-bone ring-1 ring-inset ring-gp-bone/15"}`}
                    >
                      {plan.trialDays > 0 ? "Start free trial" : "Get started"} <FiArrowRight className="h-4 w-4" />
                    </Link>

                    <dl className="mt-6 grid grid-cols-2 gap-2 text-xs text-gp-mist">
                      {[
                        ["Members", plan.limits.maxMembers],
                        ["Staff", plan.limits.maxStaff],
                        ["Trainers", plan.limits.maxTrainers],
                        ["Classes", plan.limits.maxClasses],
                      ].map(([l, n], j) => (
                        <div key={String(l)} className={`a-pop rounded-xl px-3 py-2 ${isPopular ? "bg-gp-bone/[0.06]" : "bg-gp-bone/5"}`} style={stagger(i * 2 + 3 + j)}>
                          <dt className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{l}</dt>
                          <dd className="text-sm font-semibold text-gp-bone">{limit(Number(n))}</dd>
                        </div>
                      ))}
                    </dl>

                    {/* Add-ons get a card of their own rather than a line of
                        small print -- whether the plan sells it or gives it
                        away. */}
                    {(includedFor(plan).length > 0 || sellableFor(plan).length > 0) && (
                      <div className="mt-6 space-y-2.5">
                        {includedFor(plan).map((addon) => (
                          <AddonTile key={addon.slug} addon={addon} included isPopular={isPopular} yearly={yearly} />
                        ))}
                        {sellableFor(plan).map((addon) => (
                          <AddonTile key={addon.slug} addon={addon} included={false} isPopular={isPopular} yearly={yearly} />
                        ))}
                      </div>
                    )}
                    {plan.features.filter((f) => !repeatsLimits(f)).length > 0 && (
                      <ul className={`mt-6 space-y-2 text-sm ${isPopular ? "text-gp-bone" : "text-gp-mist"}`}>
                        {plan.features.filter((f) => !repeatsLimits(f)).map((f, j) => (
                          <li key={f} className="a-rise flex items-start gap-2" style={stagger(i * 2 + 6 + j)}>
                            <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-gp-mint" /> {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {/* The add-on is on the cards with a price, so the cards' own page
              says where it stands today. */}
          {plans && plans.length > 0 && addons.some((a) => a.slug.includes("app")) && (
            <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-gp-slate">{PRICING.appNote}</p>
          )}
        </div>

        <div className="mt-14">
          <IncludedCard />
        </div>
      </div>
    </section>
  );
}

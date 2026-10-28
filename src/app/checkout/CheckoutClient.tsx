"use client";

// Checkout. Pick a plan, add what you want to it, tell us who you are.
//
// Two ways through, and the API says which (/public/config
// self_serve_signup). When the platform can take payment itself, the buyer
// goes on to Stripe, adds a card, and the gym is built the moment they
// finish -- nobody in the panel involved (see /checkout/success). When it
// cannot, no card is asked for: what this collects is sent as a request and
// the panel turns it into a gym, as it always has. The page says which of
// the two it is, and in the second case what happens next and how the gym
// will pay, so nobody thinks they have signed up when they have asked to.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiArrowLeft, FiArrowRight, FiCheck, FiCheckCircle, FiLock, FiSmartphone, FiPlus } from "react-icons/fi";
import {
  ApiError,
  CHECKOUT_DRAFT_KEY,
  formatMoney,
  publicFetch,
  recommendedPlanIndex,
  yearlySaving,
  type PublicAddon,
  type PublicConfig,
  type PublicPlan,
  type SignupStarted,
} from "@/lib/api";
import { trackConversion } from "@/lib/analytics";
import { PRICING } from "@/content/site";
import { stagger } from "@/lib/motion";
import { useAsyncAction } from "@/lib/useAsyncAction";
import BusySpinner from "@/components/BusySpinner";
import SiteFooter from "@/components/marketing/SiteFooter";
import Brand from "@/components/marketing/Brand";
import Glow from "@/components/marketing/Glow";
import ContactLinks from "@/components/marketing/ContactLinks";

type Cycle = "monthly" | "yearly";

const FIELDS = [
  { key: "gymName", label: "Gym name", placeholder: "Iron Works Fitness", required: true, autoComplete: "organization", wide: true },
  { key: "firstName", label: "First name", placeholder: "Aisha", required: true, autoComplete: "given-name", wide: false },
  { key: "lastName", label: "Last name", placeholder: "Khan", required: true, autoComplete: "family-name", wide: false },
  { key: "email", label: "Email", placeholder: "you@yourgym.com", required: true, type: "email", autoComplete: "email", wide: false },
  { key: "phone", label: "Phone", placeholder: "+92 300 1234567", required: false, type: "tel", autoComplete: "tel", wide: false },
  { key: "country", label: "City / country", placeholder: "Karachi, Pakistan", required: false, autoComplete: "address-level2", wide: true },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** What checkout keeps while the buyer is on Stripe (see CHECKOUT_DRAFT_KEY). */
interface Draft {
  form: Record<FieldKey, string>;
  webAddress: string;
  message: string;
  chosenAddons: string[];
}

/** "5 October": when a trial that starts today ends. */
function dayAfter(days: number) {
  return new Date(Date.now() + days * 86400000).toLocaleDateString(undefined, { day: "numeric", month: "long" });
}

export default function CheckoutClient() {
  const params = useSearchParams();
  const router = useRouter();

  const [plans, setPlans] = useState<PublicPlan[] | null>(null);
  // Set when the price list could not be loaded, so the page says so and
  // offers a retry instead of a form whose button never wakes up.
  const [plansError, setPlansError] = useState<string | null>(null);
  const [addons, setAddons] = useState<PublicAddon[]>([]);
  // The domain gyms get their address under; "" when the platform has none
  // (a gym then gets its address when it is set up), null while unknown.
  const [rootDomain, setRootDomain] = useState<string | null>(null);
  // Whether this checkout takes payment and builds the gym itself; null
  // while the API has not said, false for the request the panel acts on.
  const [selfServe, setSelfServe] = useState<boolean | null>(null);
  const [planSlug, setPlanSlug] = useState(params.get("plan") || "");
  const [cycle, setCycle] = useState<Cycle>(params.get("cycle") === "yearly" ? "yearly" : "monthly");
  const [chosenAddons, setChosenAddons] = useState<string[]>([]);
  const [form, setForm] = useState<Record<FieldKey, string>>({ gymName: "", firstName: "", lastName: "", email: "", phone: "", country: "" });
  const [webAddress, setWebAddress] = useState("");
  const [touchedAddress, setTouchedAddress] = useState(false);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  // Held from the click until the answer, or until the page has left for
  // Stripe; let go again if Back brings the page back from the browser's cache.
  const { busy, run } = useAsyncAction();
  const [error, setError] = useState<string | null>(null);
  // The web address was taken; `suggestion` is a free one to offer instead.
  const [addressError, setAddressError] = useState<{ message: string; suggestion: string } | null>(null);
  // Bumped each time a problem is shown, even one that reads the same as the
  // last: the button is at the foot of the form and the message near its top,
  // so the page brings the message into view rather than seem to do nothing.
  const [problem, setProblem] = useState(0);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!problem) return;
    const target = errorRef.current || addressRef.current;
    target?.scrollIntoView({ block: "center" });
    target?.focus({ preventScroll: true });
  }, [problem]);
  // Back from Stripe without paying.
  const cancelled = params.get("cancelled") === "1";
  // Add-ons from a draft, applied once the plan's add-ons have loaded (see below).
  const draftAddons = useRef<string[] | null>(null);
  const [done, setDone] = useState(false);
  // Whether a confirmation email can actually reach them. The API answers
  // this: a platform with no sender configured sends nothing, and the
  // receipt below must not point at an inbox that will stay empty.
  const [emailed, setEmailed] = useState(true);

  const loadPlans = useCallback(() => {
    setPlans(null);
    setPlansError(null);
    publicFetch<{ data: PublicPlan[] }>("/plans")
      .then((res) => {
        setPlans(res.data);
        // The plan the pricing page sent them with, while it is still sold;
        // otherwise the one the pricing page recommends.
        setPlanSlug((current) =>
          current && res.data.some((p) => p.slug === current) ? current : res.data[recommendedPlanIndex(res.data)]?.slug || ""
        );
      })
      .catch((e) => setPlansError(e instanceof Error ? e.message : "Could not load the plans."));
  }, []);

  useEffect(() => {
    loadPlans();
    publicFetch<{ data: PublicAddon[] }>("/addons")
      .then((res) => setAddons(res.data))
      .catch(() => setAddons([]));
    publicFetch<{ data: PublicConfig }>("/config")
      .then((res) => {
        setRootDomain(res.data.root_domain || "");
        setSelfServe(res.data.self_serve_signup === true);
      })
      .catch(() => {
        setRootDomain("");
        setSelfServe(false);
      });
  }, [loadPlans]);

  // Back from Stripe's page without paying: put back what they had typed.
  useEffect(() => {
    if (!cancelled) return;
    try {
      const raw = window.sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<Draft>;
      if (draft.form) setForm((f) => ({ ...f, ...draft.form }));
      if (draft.webAddress) {
        setWebAddress(draft.webAddress);
        setTouchedAddress(true);
      }
      if (draft.message) setMessage(draft.message);
      if (Array.isArray(draft.chosenAddons)) draftAddons.current = draft.chosenAddons;
    } catch {
      /* nothing kept, or storage is blocked: the form starts empty */
    }
  }, [cancelled]);

  const plan = useMemo(() => (plans || []).find((p) => p.slug === planSlug) || null, [plans, planSlug]);

  // Checkout has started once there is a plan on the page to buy. Counted
  // once, whichever plan they move to afterwards.
  const startTracked = useRef(false);
  useEffect(() => {
    if (!plan || startTracked.current) return;
    startTracked.current = true;
    trackConversion("checkout_started", { plan: plan.slug, value: plan.price.monthly, currency: plan.price.currency });
  }, [plan]);
  // Yearly is only on offer where the plan has a yearly price: a link that
  // says ?cycle=yearly for a monthly-only plan, or a switch to one, lands on
  // monthly rather than on a price of nothing.
  const hasYearly = !!plan && plan.price.yearly > 0;
  useEffect(() => {
    if (plan && !hasYearly) setCycle("monthly");
  }, [plan, hasYearly]);
  const saving = plan ? yearlySaving(plan.price) : 0;

  const included = useMemo(
    () => (plan ? addons.filter((a) => (plan.includedAddons || []).includes(a.slug)) : []),
    [plan, addons]
  );
  // Sold with this plan, and priced in its currency: a PKR add-on cannot go
  // on a USD bill, so it is simply not offered.
  const sellable = useMemo(
    () =>
      plan
        ? addons.filter(
            (a) =>
              !(plan.includedAddons || []).includes(a.slug) &&
              (!a.planSlugs.length || a.planSlugs.includes(plan.slug)) &&
              a.price.currency === plan.price.currency
          )
        : [],
    [plan, addons]
  );

  // An add-on stays chosen only while the plan it was chosen on still sells it.
  useEffect(() => {
    setChosenAddons((list) => list.filter((slug) => sellable.some((a) => a.slug === slug)));
  }, [sellable]);

  // A draft's add-ons, once there are add-ons to match them against: applied
  // any earlier and the line above would drop them as not sold.
  useEffect(() => {
    if (!draftAddons.current || !sellable.length) return;
    const wanted = draftAddons.current;
    draftAddons.current = null;
    setChosenAddons(wanted.filter((slug) => sellable.some((a) => a.slug === slug)));
  }, [sellable]);

  const priceOf = (p: { monthly: number; yearly: number }) => (cycle === "yearly" ? p.yearly : p.monthly);
  const planPrice = plan ? priceOf(plan.price) : 0;
  const addonLines = sellable.filter((a) => chosenAddons.includes(a.slug));
  const total = addonLines.reduce((sum, a) => sum + priceOf(a.price), planPrice);
  const currency = plan?.price.currency || "PKR";
  const per = cycle === "yearly" ? "year" : "month";

  const submit = () => {
    if (!plan) return;
    const missing = FIELDS.filter((f) => f.required && !form[f.key].trim());
    if (missing.length) {
      setError(`${missing[0].label} is required.`);
      setProblem((n) => n + 1);
      return;
    }
    run("submit", async (leave) => {
      setError(null);
      setAddressError(null);
      const details = {
        ...form,
        // The record keeps one name; the form asks for both halves because
        // that is how the owner's account inside the gym is created.
        name: `${form.firstName} ${form.lastName}`.trim(),
        message,
        website, // honeypot: a person never fills this
        preferredSlug: webAddress || slugify(form.gymName),
        planSlug: plan.slug,
        billingCycle: cycle,
        addonSlugs: chosenAddons,
        source: typeof window !== "undefined" ? window.location.href : "",
      };
      try {
        if (selfServe) {
          try {
            const res = await publicFetch<SignupStarted>("/signup", {
              method: "POST",
              // The browser's clock is the best guess at the gym's timezone.
              body: { ...details, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "" },
            });
            if (res.url) {
              try {
                const draft: Draft = { form, webAddress, message, chosenAddons };
                window.sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
              } catch {
                /* storage blocked: "back" from Stripe just starts the form again */
              }
              // On its way to Stripe: the button stays busy.
              leave();
              window.location.assign(res.url);
              return;
            }
          } catch (e) {
            // Paying online was switched off since this page loaded: send the
            // details the way it always worked instead of failing.
            if (!(e instanceof ApiError && e.code === "SELF_SERVE_UNAVAILABLE")) throw e;
            setSelfServe(false);
          }
        }
        const sent = await publicFetch<{ emailed?: boolean }>("/demo-requests", { method: "POST", body: { kind: "trial", ...details } });
        setEmailed(sent?.emailed !== false);
        setDone(true);
        // A trial asked for, not a sign-up: nobody has paid, and the card
        // sign-up (checkout/success) is the one counted as signup_completed.
        trackConversion("trial_requested", { plan: plan.slug, value: total, currency, method: "request" });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        if (e instanceof ApiError && e.code === "SLUG_TAKEN") {
          setAddressError({ message: e.message, suggestion: typeof e.body.suggestion === "string" ? e.body.suggestion : "" });
        } else {
          setError(e instanceof Error ? e.message : "Could not send that. Please try again.");
        }
        setProblem((n) => n + 1);
      }
    });
  };

  /* ------------------------------ the receipt ----------------------------- */
  if (done) {
    return (
      <main className="gp-site relative min-h-screen overflow-hidden bg-gp-void px-5 py-24 font-gp text-gp-bone">
        <div className="bg-grid-dark absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_70%)]" aria-hidden="true" />
        <Glow className="left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 -translate-y-1/3" color="rgb(var(--gp-mint) / 0.14)" drift="a" />
        <div className="relative mx-auto max-w-xl text-center">
          <span className="a-pop mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gp-mint/15 text-gp-mint ring-1 ring-inset ring-gp-mint/30">
            <FiCheckCircle className="h-8 w-8" />
          </span>
          <h1 className="a-rise gp-shine mt-6 pb-1 text-3xl font-medium tracking-[-0.04em] sm:text-4xl" style={stagger(1)}>
            That is everything we need
          </h1>
          <p className="a-rise mt-4 text-lg leading-relaxed text-gp-mist" style={stagger(2)}>
            {emailed ? (
              <>
                We have sent a confirmation to <span className="font-semibold text-gp-bone">{form.email}</span>. We are setting up {form.gymName} now,
                and a second email with your web address and a link to set your admin password follows, usually within one working day.
              </>
            ) : (
              <>
                We have your details and we are setting up {form.gymName} now. We will come back to you on{" "}
                <span className="font-semibold text-gp-bone">{form.email}</span>
                {form.phone ? <> or {form.phone}</> : null} with your web address and a link to set your admin password, usually within one working
                day.
              </>
            )}
          </p>
          {emailed ? (
            <p className="a-rise mt-3 text-sm text-gp-slate" style={stagger(2)}>
              Nothing in your inbox in a few minutes? Check your spam folder.
            </p>
          ) : null}
          <div className="a-rise mt-8 rounded-2xl border border-gp-bone/10 bg-gp-bone/5 p-5 text-left text-sm" style={stagger(3)}>
            <p className="text-[13px] text-gp-slate">What you chose</p>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <span className="text-gp-mist">
                {plan?.name} · {cycle}
              </span>
              <span className="font-gp-brand text-lg font-semibold">
                {formatMoney(total, currency)} <span className="text-xs font-normal text-gp-slate">/ {per}</span>
              </span>
            </div>
            {plan?.trialDays ? <p className="mt-2 text-xs text-gp-mint">Free for the first {plan.trialDays} days. Nothing to pay today.</p> : null}
            <p className="mt-3 border-t border-gp-bone/10 pt-3 text-xs leading-relaxed text-gp-slate">
              How you pay: we contact you with payment details before anything is due. Bank transfer, JazzCash or Easypaisa.
            </p>
          </div>
          <Link
            href="/"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-gp-bone px-[22px] text-[15px] font-medium text-gp-ink transition-transform duration-300 hover:-translate-y-0.5"
          >
            Back to the website <FiArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-10 text-sm text-gp-slate">Questions in the meantime?</p>
          <ContactLinks layout="row" className="mt-3" />
        </div>
      </main>
    );
  }

  /* ------------------------------- the form ------------------------------- */
  return (
    <div className="gp-site min-h-screen bg-gp-void font-gp text-gp-bone">
      <header className="border-b border-gp-edge bg-gp-void/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Brand />
          <button
            type="button"
            onClick={() => router.push("/#pricing")}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-gp-edge-2 px-3 text-[13.5px] text-gp-mist transition-colors hover:border-gp-mint hover:text-gp-bone"
          >
            <FiArrowLeft className="h-4 w-4" /> Back to pricing
          </button>
        </div>
      </header>

      <main className="min-h-screen bg-gp-void px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="a-rise text-[13px] text-gp-mint">Checkout</p>
          <h1 className="a-rise gp-shine mt-2 pb-1 text-3xl font-medium tracking-[-0.04em] sm:text-[44px] sm:leading-[1.05]" style={stagger(1)}>
            {selfServe === false ? "Request your free trial" : "Start your free trial"}
          </h1>
          <p className="a-rise mt-3 max-w-2xl text-base text-gp-slate" style={stagger(2)}>
            {selfServe === null
              ? "Pick a plan and tell us about your gym."
              : selfServe
              ? "Pick a plan, tell us about your gym, then add a card on Stripe's secure page. Your gym — website, admin and all — is set up the moment you finish."
              : "No card needed. Send us your details and our team sets your gym up — website, admin and all — usually within one working day."}
          </p>

          {cancelled && (
            <p className="a-rise mt-5 max-w-2xl rounded-xl border border-gp-ember/30 bg-gp-ember/10 px-4 py-3 text-sm text-gp-ember" style={stagger(2)}>
              Payment cancelled — nothing was charged. Your details are still here whenever you are ready.
            </p>
          )}

          {plansError ? (
            <div className="mt-10 rounded-[20px] border border-rose-500/30 bg-gp-graphite p-8 text-center">
              <p className="text-base font-medium text-gp-bone">We could not load the plans.</p>
              <p className="mt-1 text-sm text-gp-mist">Check your connection and try again. Nothing you typed has been sent.</p>
              <button
                type="button"
                onClick={loadPlans}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-gp-bone px-6 text-sm font-medium text-gp-ink transition-transform hover:-translate-y-0.5"
              >
                Try again
              </button>
              <p className="mt-6 text-sm text-gp-slate">Still not loading? Reach us another way.</p>
              <ContactLinks layout="row" className="mt-3" />
            </div>
          ) : !plans ? (
            <div className="mt-10 h-64 animate-pulse rounded-[20px] border border-gp-edge bg-gp-graphite" />
          ) : plans.length === 0 ? (
            <div className="mt-10 rounded-[20px] border border-dashed border-gp-edge-2 bg-gp-graphite p-10 text-center">
              <p className="text-base text-gp-mist">{PRICING.fallback}</p>
              <Link href="/#demo" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-gp-bone px-6 text-sm font-medium text-gp-ink">
                Book a demo <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              {/* ---------------------------- details ---------------------------- */}
              {/* Second on a phone: what they are buying, and for how much, is read first. */}
              <div className="order-2 rounded-[20px] border border-gp-edge bg-gp-graphite p-6 sm:p-8 lg:order-1">
                <h2 className="text-lg font-medium tracking-[-0.02em] text-gp-bone">Your details</h2>

                {error && (
                  <p ref={errorRef} tabIndex={-1} role="alert" className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-500 focus:outline-none">
                    {error}
                  </p>
                )}

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {FIELDS.map((f) => (
                    <label key={f.key} className={f.wide ? "sm:col-span-2" : ""}>
                      <span className="text-[13px] font-normal text-gp-mist">
                        {f.label}
                        {!f.required && <span className="ml-1 font-normal text-gp-slate">optional</span>}
                      </span>
                      <input
                        type={"type" in f ? f.type : "text"}
                        value={form[f.key]}
                        autoComplete={f.autoComplete}
                        placeholder={f.placeholder}
                        onChange={(e) => {
                          setForm((x) => ({ ...x, [f.key]: e.target.value }));
                          if (f.key === "gymName" && !touchedAddress) setWebAddress(slugify(e.target.value));
                        }}
                        className="mt-1.5 h-12 w-full rounded-[11px] border border-gp-edge-2 bg-gp-bone/[0.03] px-4 text-[15px] text-gp-bone outline-none transition-colors placeholder:text-gp-slate focus:border-gp-mint focus:ring-[3px] focus:ring-gp-mint/15"
                      />
                    </label>
                  ))}

                  {rootDomain ? (
                    <label className="sm:col-span-2">
                      <span className="text-[13px] font-normal text-gp-mist">Your web address</span>
                      <div className="mt-1.5 flex items-center rounded-[11px] border border-gp-edge-2 bg-gp-bone/[0.03] pr-4 transition-colors focus-within:border-gp-mint focus-within:ring-[3px] focus-within:ring-gp-mint/15">
                        <input
                          ref={addressRef}
                          value={webAddress}
                          onChange={(e) => {
                            setTouchedAddress(true);
                            setWebAddress(slugify(e.target.value));
                            setAddressError(null);
                          }}
                          placeholder="ironworks"
                          aria-invalid={!!addressError}
                          className="h-12 min-w-0 flex-1 rounded-[11px] bg-transparent px-4 text-[15px] text-gp-bone outline-none placeholder:text-gp-slate"
                        />
                        <span className="whitespace-nowrap text-sm text-gp-slate">.{rootDomain}</span>
                      </div>
                      {addressError ? (
                        <span className="mt-1.5 block text-xs text-rose-500">
                          {addressError.message}
                          {addressError.suggestion && (
                            <button
                              type="button"
                              onClick={() => {
                                setTouchedAddress(true);
                                setWebAddress(addressError.suggestion);
                                setAddressError(null);
                              }}
                              className="ml-1.5 font-medium text-gp-mint underline underline-offset-2 hover:text-gp-bone"
                            >
                              Use {addressError.suggestion}
                            </button>
                          )}
                        </span>
                      ) : (
                        <span className="mt-1.5 block text-xs text-gp-slate">
                          Using your own domain? We&apos;ll connect it for you — contact us after sign-up.
                        </span>
                      )}
                    </label>
                  ) : (
                    <p className="sm:col-span-2 rounded-xl bg-gp-bone/[0.04] px-4 py-3 text-sm text-gp-mist">
                      You will get a web address when your gym is set up. Using your own domain? We&apos;ll connect it for you — contact us after sign-up.
                    </p>
                  )}

                  <label className="sm:col-span-2">
                    <span className="text-[13px] font-normal text-gp-mist">
                      Anything we should know <span className="ml-1 font-normal text-gp-slate">optional</span>
                    </span>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      placeholder="How many members you have, what you are moving from…"
                      className="mt-1.5 w-full rounded-[11px] border border-gp-edge-2 bg-gp-bone/[0.03] px-4 py-3 text-[15px] leading-relaxed text-gp-bone outline-none transition-colors placeholder:text-gp-slate focus:border-gp-mint focus:ring-[3px] focus:ring-gp-mint/15"
                    />
                  </label>

                  {/* Bots fill every field they find; people never see this one. */}
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="hidden"
                    aria-hidden="true"
                  />
                </div>

                {/* On a phone the plan is a scroll back up by now: say it again beside the button. */}
                <p className="mt-7 flex items-baseline justify-between gap-3 rounded-xl bg-gp-bone/[0.04] px-4 py-3 text-sm lg:hidden">
                  <span className="text-gp-mist">
                    {plan?.name || "Plan"} · {cycle}
                  </span>
                  <span className="font-medium text-gp-bone">
                    {formatMoney(total, currency)} <span className="text-xs font-normal text-gp-slate">/ {per}</span>
                  </span>
                </p>

                {/* No payment page follows this form, so it says what does. */}
                {selfServe === false && (
                  <div className="mt-4 rounded-2xl border border-gp-mint/30 bg-gp-mint/10 p-4 lg:mt-7">
                    <p className="text-[13px] text-gp-mint">What happens next</p>
                    <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-gp-mist">
                      <li>You send this form. No card, and nothing to pay today.</li>
                      <li>Our team sets your gym up and sends you your web address and a link to set your password, by email or phone, usually within one working day.</li>
                      <li>
                        {plan?.trialDays ? `Your ${plan.trialDays}-day free trial starts then. ` : ""}
                        We contact you with payment details before anything is due: bank transfer, JazzCash or Easypaisa.
                      </li>
                    </ol>
                  </div>
                )}

                <p className={`text-center text-xs leading-relaxed text-gp-slate ${selfServe === false ? "mt-4" : "mt-4 lg:mt-7"}`}>
                  By continuing you agree to our{" "}
                  <Link href="/terms" target="_blank" className="font-semibold text-gp-mist underline underline-offset-2 hover:text-gp-bone">
                    Terms
                  </Link>
                  ,{" "}
                  <Link href="/privacy" target="_blank" className="font-semibold text-gp-mist underline underline-offset-2 hover:text-gp-bone">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/refund-policy" target="_blank" className="font-semibold text-gp-mist underline underline-offset-2 hover:text-gp-bone">
                    Refund Policy
                  </Link>
                  .
                </p>

                <button
                  type="button"
                  onClick={submit}
                  disabled={busy || !plan}
                  aria-busy={busy || undefined}
                  className="group mt-3 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gp-bone py-4 text-base font-medium text-gp-ink transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {busy
                    ? selfServe
                      ? "Opening secure payment…"
                      : "Sending…"
                    : selfServe === false
                    ? "Send my request"
                    : plan?.trialDays
                    ? `Start my ${plan.trialDays}-day free trial`
                    : selfServe
                    ? "Continue to payment"
                    : "Send my details"}
                  {busy ? <BusySpinner className="h-5 w-5" /> : <FiArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                </button>

                {/* Said before they click, not discovered on Stripe's page: when the card is charged, and how much. */}
                <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-xs text-gp-slate">
                  <FiLock className="mt-px h-3.5 w-3.5 shrink-0" />
                  <span>
                    {!selfServe
                      ? "No card today. We only use these details to set your gym up and to contact you about it."
                      : plan?.trialDays
                      ? `Next, add a card on Stripe's secure page. Nothing is charged today: ${formatMoney(total, currency)} is taken on ${dayAfter(
                          plan.trialDays
                        )}, then every ${per}, unless you cancel before then.`
                      : `Next, add a card on Stripe's secure page. You pay ${formatMoney(total, currency)} today, then every ${per} until you cancel.`}
                  </span>
                </p>

                <div className="mt-6 border-t border-gp-edge pt-5 text-center">
                  <p className="text-[13px] text-gp-slate">Stuck, or have a question?</p>
                  <ContactLinks layout="row" className="mt-3" />
                </div>
              </div>

              {/* ----------------------------- summary --------------------------- */}
              <aside className="order-1 lg:sticky lg:top-8 lg:order-2 lg:self-start">
                <div className="rounded-[20px] border border-gp-edge bg-gp-graphite p-6">
                  <h2 className="text-lg font-medium tracking-[-0.02em] text-gp-bone">Your plan</h2>

                  {hasYearly ? (
                    <div className="mt-4 inline-flex w-full items-center rounded-full border border-gp-edge bg-gp-bone/[0.04] p-1 text-sm">
                      {(["monthly", "yearly"] as Cycle[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCycle(c)}
                          className={`flex-1 rounded-full px-3 py-1.5 font-medium capitalize transition-all ${
                            cycle === c ? "bg-gp-bone text-gp-ink shadow" : "text-gp-mist hover:text-gp-bone"
                          }`}
                        >
                          {c}
                          {c === "yearly" && saving > 0 && <span className="ml-1 text-[11px] text-gp-mint">save {saving}%</span>}
                        </button>
                      ))}
                    </div>
                  ) : (
                    plan && <p className="mt-3 text-xs text-gp-slate">{plan.name} is billed monthly.</p>
                  )}

                  <div className="mt-4 space-y-2">
                    {(plans || []).map((p) => {
                      const on = p.slug === planSlug;
                      return (
                        <button
                          key={p.slug}
                          type="button"
                          onClick={() => setPlanSlug(p.slug)}
                          className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                            on ? "border-gp-mint bg-gp-mint/10 ring-1 ring-gp-mint/30" : "border-gp-edge hover:border-gp-edge-2"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              on ? "border-gp-mint bg-gp-mint text-gp-ink" : "border-gp-edge-2"
                            }`}
                          >
                            {on && <FiCheck className="h-3 w-3" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-gp-bone">{p.name}</span>
                            <span className="block truncate text-xs text-gp-slate">
                              {p.limits.maxMembers ? `up to ${p.limits.maxMembers.toLocaleString()} members` : "unlimited members"}
                            </span>
                          </span>
                          {/* A monthly-only plan shows its monthly price even on yearly; picking it switches to monthly. */}
                          <span className="whitespace-nowrap text-sm font-medium text-gp-bone">
                            {formatMoney(cycle === "yearly" && p.price.yearly > 0 ? p.price.yearly : p.price.monthly, p.price.currency)}
                            {cycle === "yearly" && !(p.price.yearly > 0) && <span className="text-xs font-normal text-gp-slate"> /mo</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {(included.length > 0 || sellable.length > 0) && (
                    <>
                      <p className="mt-6 text-[13px] text-gp-slate">Add-ons</p>
                      <div className="mt-2 space-y-2">
                        {included.map((addon) => (
                          <div key={addon.slug} className="flex items-center gap-3 rounded-2xl border border-gp-mint/30 bg-gp-mint/10 p-3">
                            <FiCheck className="h-4 w-4 shrink-0 text-gp-mint" />
                            <span className="min-w-0 flex-1 text-sm font-semibold text-gp-bone">{addon.name}</span>
                            <span className="text-sm font-medium text-gp-mint">Free</span>
                          </div>
                        ))}
                        {sellable.map((addon) => {
                          const on = chosenAddons.includes(addon.slug);
                          return (
                            <button
                              key={addon.slug}
                              type="button"
                              onClick={() =>
                                setChosenAddons((list) => (on ? list.filter((s) => s !== addon.slug) : [...list, addon.slug]))
                              }
                              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                                on ? "border-gp-mint bg-gp-mint/10 ring-1 ring-gp-mint/30" : "border-gp-edge hover:border-gp-edge-2"
                              }`}
                            >
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                                  on ? "border-gp-mint bg-gp-mint text-gp-ink" : "border-gp-edge-2"
                                }`}
                              >
                                {on ? <FiCheck className="h-3 w-3" /> : <FiPlus className="h-3 w-3 text-gp-slate" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5 text-sm font-medium text-gp-bone">
                                  {addon.slug.includes("app") && <FiSmartphone className="h-3.5 w-3.5 text-gp-mint" />}
                                  {addon.name}
                                </span>
                                <span className="block truncate text-xs text-gp-slate">{addon.description}</span>
                              </span>
                              <span className="whitespace-nowrap text-sm font-medium text-gp-bone">
                                +{formatMoney(priceOf(addon.price), addon.price.currency)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {[...included, ...sellable].some((a) => a.slug.includes("app")) && (
                        <p className="mt-2 text-xs leading-relaxed text-gp-slate">{PRICING.appNote}</p>
                      )}
                    </>
                  )}

                  <div className="mt-6 border-t border-gp-edge pt-4 text-sm">
                    <div className="flex justify-between text-gp-mist">
                      <span>{plan?.name || "Plan"}</span>
                      <span className="font-medium text-gp-bone">{formatMoney(planPrice, currency)}</span>
                    </div>
                    {addonLines.map((addon) => (
                      <div key={addon.slug} className="mt-1.5 flex justify-between text-gp-mist">
                        <span>{addon.name}</span>
                        <span className="font-medium text-gp-bone">+{formatMoney(priceOf(addon.price), currency)}</span>
                      </div>
                    ))}
                    <div className="mt-3 flex items-baseline justify-between border-t border-gp-edge pt-3">
                      <span className="font-semibold text-gp-bone">Total</span>
                      <span className="font-gp-brand text-2xl font-semibold text-gp-bone">
                        {formatMoney(total, currency)}
                        <span className="text-sm font-normal text-gp-slate"> / {per}</span>
                      </span>
                    </div>
                    {plan?.trialDays ? (
                      <p className="mt-3 rounded-xl bg-gp-mint/10 px-3 py-2 text-center text-xs font-semibold text-gp-mint">
                        Free for {plan.trialDays} days · nothing to pay today
                      </p>
                    ) : selfServe ? (
                      <p className="mt-3 rounded-xl bg-gp-bone/[0.04] px-3 py-2 text-center text-xs font-semibold text-gp-mist">
                        Charged today, then every {per}
                      </p>
                    ) : null}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

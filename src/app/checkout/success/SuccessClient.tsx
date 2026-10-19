"use client";

// Where Stripe sends a buyer once they have paid (?signup=<id>). The gym is
// made by the platform's webhook, usually within seconds of the payment;
// this page asks the API how far it has got until the gym is ready (or its
// setup has failed) and says so in plain words.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiAlertTriangle, FiArrowRight, FiCheckCircle, FiExternalLink, FiMail, FiMessageCircle } from "react-icons/fi";
import ContactLinks from "@/components/marketing/ContactLinks";
import { ApiError, CHECKOUT_DRAFT_KEY, publicFetch, type SignupStatus } from "@/lib/api";
import { trackConversionOnce } from "@/lib/analytics";
import { SITE } from "@/content/site";
import { stagger } from "@/lib/motion";
import Glow from "@/components/marketing/Glow";

// Every few seconds while the gym is being made; less often once it has
// taken longer than it should (Stripe can be slow to call back), or has
// failed and is waiting on Stripe's next retry.
const QUICK_MS = 2500;
const PATIENT_MS = 15000;
const SLOW_AFTER_MS = 2 * 60 * 1000;

export default function SuccessClient() {
  const id = useSearchParams().get("signup") || "";
  const [state, setState] = useState<SignupStatus | null>(null);
  const [missing, setMissing] = useState(!id);
  const [slow, setSlow] = useState(false);

  // They have paid: the form checkout kept for "back from Stripe" can go.
  useEffect(() => {
    try {
      window.sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
    } catch {
      /* storage blocked: nothing was kept */
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const started = Date.now();

    const poll = async () => {
      let wait = QUICK_MS;
      try {
        const res = await publicFetch<{ data: SignupStatus }>(`/signup/${encodeURIComponent(id)}/status`);
        if (stopped) return;
        setState(res.data);
        // Paid: the gym is being made or is ready. Once per sign-up, however
        // often this page asks or is reloaded.
        if (res.data.status === "provisioning" || res.data.status === "ready") trackConversionOnce(`signup.${id}`, "signup_completed", { method: "card" });
        if (res.data.status === "ready") return;
        if (res.data.status === "failed") wait = PATIENT_MS;
      } catch (e) {
        if (stopped) return;
        if (e instanceof ApiError && e.status === 404) {
          setMissing(true);
          return;
        }
        // A dropped connection: keep asking, less often.
        wait = PATIENT_MS;
      }
      if (Date.now() - started > SLOW_AFTER_MS) {
        setSlow(true);
        wait = PATIENT_MS;
      }
      timer = setTimeout(poll, wait);
    };

    poll();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  const status = missing ? null : state?.status;
  const ready = status === "ready";
  const trouble = missing || status === "failed";
  const working = !ready && !trouble;

  const heading = missing
    ? "We could not find that sign-up"
    : !state
    ? "Checking on your payment…"
    : ready
    ? "Your gym is ready"
    : status === "failed"
    ? "We hit a snag setting up your gym"
    : status === "provisioning"
    ? "Setting up your gym…"
    : "Confirming your payment…";

  const text = missing
    ? "If you have just paid, your gym is still being set up and your sign-in link will reach you shortly, by email or from our team. There is no need to pay again."
    : state?.message || "One moment while we check with Stripe.";
  // Their inbox only when the API says the set-password email went.
  const emailed = ready && state?.inviteSent === true;

  const trialEnds = ready && state?.trialEndsAt ? new Date(state.trialEndsAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-5 py-24 text-white">
      <div className="bg-grid-dark absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_70%)]" aria-hidden="true" />
      <Glow
        className="left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 -translate-y-1/3"
        color={trouble ? "rgba(245,158,11,0.28)" : ready ? "rgba(16,185,129,0.32)" : "rgba(99,102,241,0.32)"}
        drift="a"
      />
      <div className="relative mx-auto max-w-xl text-center" aria-live="polite">
        {ready ? (
          <span className="a-pop mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <FiCheckCircle className="h-8 w-8" />
          </span>
        ) : trouble ? (
          <span className="a-pop mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-inset ring-amber-500/30">
            <FiAlertTriangle className="h-8 w-8" />
          </span>
        ) : (
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-inset ring-white/10">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-indigo-400" aria-hidden="true" />
          </span>
        )}

        <h1 className="a-rise mt-6 font-display text-3xl font-extrabold tracking-tight sm:text-4xl" style={stagger(1)}>
          {heading}
        </h1>
        <p className="a-rise mt-4 text-lg leading-relaxed text-slate-300" style={stagger(2)}>
          {text}
        </p>

        {working && slow && (
          <>
            <p className="mt-3 text-sm text-slate-400">
              This is taking longer than usual. You can close this page — there is no need to pay again, and your sign-in link reaches you, by
              email or from our team, once your gym is ready.
            </p>
            <ContactLinks layout="row" className="mt-5" />
          </>
        )}

        {ready && (
          <>
            <div className="a-rise mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-left text-sm text-slate-300" style={stagger(3)}>
              {emailed ? (
                <p className="flex items-start gap-2.5">
                  <FiMail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Look for an email with your set-password link. Nothing in a few minutes? Check your spam folder.</span>
                </p>
              ) : (
                <p className="flex items-start gap-2.5">
                  <FiMessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Our team will contact you with the link to set your password, usually within one working day.</span>
                </p>
              )}
              {trialEnds && (
                <p className="text-xs text-emerald-400">
                  Your free trial runs until {trialEnds}. Your card is first charged then, unless you cancel before.
                </p>
              )}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {state?.siteUrl && (
                <a
                  href={state.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-shine btn-shine-dark inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-slate-900 transition-transform hover:-translate-y-0.5"
                >
                  Open your website <FiExternalLink className="h-4 w-4" />
                </a>
              )}
              <Link href="/" className="inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold text-slate-300 hover:text-white">
                Back to {SITE.name} <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}

        {trouble && (
          <div className="mt-8 flex flex-col items-center gap-3">
            {/* Something went wrong after they paid: never leave them with nobody to ask. */}
            <p className="text-sm text-slate-400">Tell us and we will sort it out.</p>
            <ContactLinks layout="row" />
            <Link href="/" className="inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold text-slate-300 hover:text-white">
              Back to {SITE.name} <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

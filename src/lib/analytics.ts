// Measuring the adverts. Nothing here runs unless an id is set in the
// environment: NEXT_PUBLIC_GA_ID loads Google Analytics 4 and
// NEXT_PUBLIC_META_PIXEL_ID loads the Meta Pixel (components/Analytics.tsx).
// With neither, no script is loaded and trackConversion() does nothing.
//
// Only the name of what happened is sent, with the plan and its price where
// there is one. Never a name, an email or anything typed into a form.

/** An id is pasted into a script tag, so it is taken only in the shape an id has. */
const idFrom = (value: string | undefined, shape: RegExp) => {
  const id = (value || "").trim();
  return shape.test(id) ? id : "";
};

export const GA_ID = idFrom(process.env.NEXT_PUBLIC_GA_ID, /^[A-Za-z0-9-]+$/);
export const META_PIXEL_ID = idFrom(process.env.NEXT_PUBLIC_META_PIXEL_ID, /^\d+$/);

/**
 * The things an advert is paid to cause: a demo booked, checkout reached, a
 * trial asked for (checkout's form, no card) and a sign-up paid by card.
 */
export type Conversion = "demo_request" | "checkout_started" | "trial_requested" | "signup_completed";

/** Counted, but not a conversion: nothing an advert is judged on. A message sent from the contact page. */
export type Activity = "contact_message";

// Each network's own name for the event, so its reports recognise it. The two
// kinds of lead share Meta's Lead and are told apart by `category`; the
// contact message is a custom Meta event, not a standard one an ad set could
// be optimised for.
const NAMES: Record<Conversion | Activity, { ga: string; meta: string; category?: string; custom?: boolean }> = {
  demo_request: { ga: "generate_lead", meta: "Lead", category: "demo" },
  checkout_started: { ga: "begin_checkout", meta: "InitiateCheckout" },
  trial_requested: { ga: "trial_requested", meta: "Lead", category: "trial" },
  signup_completed: { ga: "sign_up", meta: "CompleteRegistration" },
  contact_message: { ga: "contact_message", meta: "ContactMessage", custom: true },
};

export interface ConversionDetail {
  /** The plan's slug. */
  plan?: string;
  /** What the plan costs per period, in `currency`. */
  value?: number;
  currency?: string;
  /** How they signed up: "card" (paid on Stripe) or "request" (sent the form). */
  method?: string;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

// The scripts load after the page is interactive, so a conversion that
// happens early (reaching checkout) waits for them: up to five seconds, then
// it goes to whichever did load. A blocked tracker costs nothing but the wait.
const WAIT_MS = 250;
const MAX_WAITS = 20;

const loaded = () => (!GA_ID || typeof window.gtag === "function") && (!META_PIXEL_ID || typeof window.fbq === "function");

function send(what: Conversion | Activity, detail: ConversionDetail, waits: number) {
  if (typeof window === "undefined" || (!GA_ID && !META_PIXEL_ID)) return;
  if (!loaded() && waits < MAX_WAITS) {
    window.setTimeout(() => send(what, detail, waits + 1), WAIT_MS);
    return;
  }
  const names = NAMES[what];
  const money = typeof detail.value === "number" && detail.currency ? { value: detail.value, currency: detail.currency } : {};
  try {
    window.gtag?.("event", names.ga, { ...money, ...(detail.plan ? { plan: detail.plan } : {}), ...(detail.method ? { method: detail.method } : {}) });
    window.fbq?.(names.custom ? "trackCustom" : "track", names.meta, {
      ...money,
      ...(detail.plan ? { content_name: detail.plan } : {}),
      ...(names.category ? { content_category: names.category } : {}),
    });
  } catch {
    /* a blocked or broken tracker must never break the page */
  }
}

/** Tell the analytics that are switched on that a conversion happened. Safe to call anywhere. */
export function trackConversion(what: Conversion, detail: ConversionDetail = {}) {
  send(what, detail, 0);
}

/** The same for something counted that is not a conversion. */
export function trackActivity(what: Activity) {
  send(what, {}, 0);
}

/**
 * The same, at most once per `key` in this tab: a page that is reloaded, or
 * polled, must not count the same sign-up twice.
 */
export function trackConversionOnce(key: string, what: Conversion, detail: ConversionDetail = {}) {
  if (typeof window === "undefined") return;
  const name = `gympilot.tracked.${key}`;
  try {
    if (window.sessionStorage.getItem(name)) return;
    window.sessionStorage.setItem(name, "1");
  } catch {
    /* storage blocked: count it rather than lose it */
  }
  trackConversion(what, detail);
}

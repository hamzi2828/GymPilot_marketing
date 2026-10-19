// Where the GymsPilotPro API lives. The marketing site uses the public routes
// under /api/platform/public; the panel uses the rest with a platform token.

export const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");
export const PLATFORM_API = `${API_BASE}/api/platform`;

export class ApiError extends Error {
  status: number;
  code?: string;
  /** The whole error body, for the fields a caller acts on (a signup's `suggestion`, say). */
  body: Record<string, unknown>;
  constructor(message: string, status: number, code?: string, body: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

/** fetch() against a public platform route: no session, JSON in and out. */
export async function publicFetch<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${PLATFORM_API}/public${path}`, {
    method: init.method || "GET",
    headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  let json: { success?: boolean; message?: string; code?: string } & Record<string, unknown> = {};
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) throw new ApiError(json.message || `Request failed (${res.status})`, res.status, json.code, json);
  return json as T;
}

export interface PublicPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: { monthly: number; yearly: number; currency: string };
  limits: { maxMembers: number; maxStaff: number; maxTrainers: number; maxClasses: number };
  features: string[];
  /** Add-on slugs this plan comes with at no extra charge. */
  includedAddons: string[];
  trialDays: number;
  order: number;
}

/** GET /public/config: how this deployment names things that the site shows. */
export interface PublicConfig {
  /** Gyms get `<slug>.<root_domain>`; empty when the platform has no root domain. */
  root_domain: string;
  /**
   * Whether checkout can take payment and build the gym itself (POST
   * /public/signup). When false -- or missing, from an older API -- checkout
   * sends a request and the panel sets the gym up.
   */
  self_serve_signup?: boolean;
}

/**
 * Where checkout keeps what was typed while the buyer is on Stripe, so
 * "back" from the payment page brings the form back filled in. Session
 * storage: this tab only, gone when it closes, cleared once they have paid.
 */
export const CHECKOUT_DRAFT_KEY = "gympilot.checkout.draft";

/** POST /public/signup: the Stripe page to send the buyer to. */
export interface SignupStarted {
  id: string;
  url: string;
}

/** GET /public/signup/:id/status: how far a paid signup has got. Nothing personal. */
export interface SignupStatus {
  status: "awaiting_payment" | "provisioning" | "ready" | "failed";
  message: string;
  /** The gym's website, once it exists. */
  siteUrl?: string | null;
  /** When the free trial ends and the card is first charged; null when not on a trial. */
  trialEndsAt?: string | null;
  /**
   * Once ready: whether the owner's set-password email went. Only `true`
   * points the buyer at their inbox; otherwise our team sends the link.
   */
  inviteSent?: boolean;
}

/** Sold beside a plan. `planSlugs` empty means it goes with any of them. */
export interface PublicAddon {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: { monthly: number; yearly: number; currency: string };
  planSlugs: string[];
}

/** The plan we recommend to most gyms: up to 300 members (scripts/platform/seedPlans.js). */
const RECOMMENDED_PLAN_SLUG = "starter";

/**
 * The plan the site points at. Pricing marks it "Recommended" and checkout
 * starts on it. It is our advice, not a count of what others bought. When
 * the price list has no plan by that name it is the second one up -- never
 * the cheapest, never the dearest.
 */
export function recommendedPlanIndex(plans: { slug: string }[]): number {
  const named = plans.findIndex((p) => p.slug === RECOMMENDED_PLAN_SLUG);
  if (named >= 0) return named;
  return plans.length >= 3 ? 1 : 0;
}

/** What paying yearly saves on twelve monthly payments, in whole percent; 0 when there is no yearly price. */
export function yearlySaving(price: { monthly: number; yearly: number }): number {
  if (!(price.yearly > 0) || !(price.monthly > 0)) return 0;
  return Math.max(0, Math.round((1 - price.yearly / (price.monthly * 12)) * 100));
}

export function formatMoney(amount: number, currency: string, fractionDigits = 0): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "PKR", maximumFractionDigits: fractionDigits, minimumFractionDigits: 0 }).format(amount || 0);
  } catch {
    return `${currency} ${amount}`;
  }
}

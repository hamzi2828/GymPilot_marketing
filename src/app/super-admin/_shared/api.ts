// src/app/super-admin/_shared/api.ts
//
// The platform panel's API client. Its session is separate from a gym's:
// a platform token lives under its own key, is sent only to /api/platform,
// and is refused by every gym endpoint (and vice versa).

import { PLATFORM_API } from "@/lib/api";

export { API_BASE, PLATFORM_API } from "@/lib/api";

const TOKEN_KEY = "platform_token";

export function getPlatformToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** When the token itself runs out, read from its payload; null when it cannot be read. */
function tokenExpiry(token: string): Date | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? new Date(payload.exp * 1000) : null;
  } catch {
    return null;
  }
}

// Stored in localStorage for requests and mirrored in a cookie so the edge
// middleware can turn away a signed-out visitor before the page loads. The
// cookie lasts exactly as long as the token: a cookie that died with the
// browser window sent a still-signed-in admin back to the sign-in page.
export function setPlatformToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    const expires = tokenExpiry(token);
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; samesite=lax${expires ? `; expires=${expires.toUTCString()}` : ""}${window.location.protocol === "https:" ? "; secure" : ""}`;
  } catch {
    /* storage blocked -- the session lasts this page view only */
  }
}

export function clearPlatformToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; Max-Age=0; path=/; samesite=lax`;
  } catch {
    /* nothing to clear */
  }
}

export class PlatformApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * fetch() against the platform API. Throws PlatformApiError with the
 * server's message; a 401 also ends the session and returns to the login.
 */
export async function platformFetch<T>(path: string, init: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getPlatformToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (init.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${PLATFORM_API}${path}`, {
    method: init.method || "GET",
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  let json: { success?: boolean; message?: string; code?: string } & Record<string, unknown> = {};
  try {
    json = await res.json();
  } catch {
    /* no body */
  }

  if (res.status === 401 && !path.startsWith("/auth/login")) {
    clearPlatformToken();
    if (typeof window !== "undefined") window.location.href = "/login";
  }
  if (!res.ok) throw new PlatformApiError(json.message || `Request failed (${res.status})`, res.status, json.code);
  return json as T;
}

// ---- Types shared by the panel's pages ----------------------------------

export interface PlatformAdmin {
  id: string;
  name: string;
  email: string;
  last_login: string | null;
  two_factor?: boolean;
  /** How the second step is done while two_factor is on. */
  two_factor_method?: "email" | "app" | null;
  /** Unused backup codes, when the authenticator app is on. */
  backup_codes_left?: number | null;
}

export interface PlatformConfig {
  platform_database: string;
  tenant_database_prefix: string;
  root_domain: string;
  default_tenant_slug: string;
}

export interface Plan {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description: string;
  price: { monthly: number; yearly: number; currency: string };
  limits: { maxMembers: number; maxStaff: number; maxTrainers: number; maxClasses: number };
  features: string[];
  /** Add-on slugs this plan gives away rather than sells. */
  includedAddons: string[];
  trialDays: number;
  isActive: boolean;
  order: number;
  gym_count?: number;
}

/** Something sold beside a plan -- see platform/models/platformAddonModel.js. */
export interface Addon {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description: string;
  price: { monthly: number; yearly: number; currency: string };
  /** Empty means it can go on any plan. */
  planSlugs: string[];
  isPublic: boolean;
  isActive: boolean;
  order: number;
  gym_count?: number;
}

export interface GymStats {
  members?: number;
  staff?: number;
  trainers?: number;
  classes?: number;
  active_memberships?: number;
  /** Members on a card subscription in the gym's own Stripe account that will charge again. */
  card_subscriptions?: number;
  pending_orders?: number;
  revenue_this_month?: { currency: string; total: number; orders: number }[];
  last_visit_at?: string | null;
  last_login_at?: string | null;
  error?: string;
}

export interface Gym {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  status: "active" | "suspended";
  domains: { host: string; isPrimary: boolean; addedAt?: string }[];
  database: { name: string };
  owner: { firstName: string; lastName: string; email: string; phone: string };
  plan: string | Plan | null;
  subscription: {
    status: "trialing" | "active" | "past_due" | "expired" | "cancelled";
    billingCycle: "monthly" | "yearly";
    /** The whole bill for a cycle: the plan plus whatever add-ons are on. */
    amount: number;
    planAmount?: number;
    addons?: { slug: string; name: string; amount: number }[];
    currency: string;
    startedAt: string | null;
    currentPeriodEnd: string | null;
    cancelledAt: string | null;
    notes: string;
    /** Set once the gym has paid the platform by card (see BILLING.md). */
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripePriceSummary?: string;
  };
  locale: { timezone: string; currency: string; country: string };
  notes: string;
  provisionedAt: string | null;
  createdAt: string;
  updatedAt: string;
  access_block: { status: number; code: string; message: string } | null;
  /** Where its website is: primary domain, else platform subdomain, else the API's fallback. */
  siteUrl?: string;
  stats?: GymStats | null;
}

/** A payment taken outside Stripe and recorded by hand (GET /gyms/:id/payments). */
export interface GymPayment {
  id: string;
  amount: number;
  currency: string;
  method: string;
  methodLabel: string;
  receivedAt: string;
  reference: string;
  note: string;
  periodFrom: string | null;
  periodTo: string;
  statusBefore: string;
  recordedBy: string;
  createdAt: string;
}

/** What the Record payment form starts from; `canRecord` is false for a gym that pays by card. */
export interface PaymentTerms {
  canRecord: boolean;
  reason: string;
  amount: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  paidFrom: string;
  paidUntil: string;
  methods: { value: string; label: string }[];
}

/** GET /gyms/:id/domains/status -- one row per registered domain. */
export interface DomainStatus {
  host: string;
  connected: boolean;
  on_project?: boolean;
  verified?: boolean;
  misconfigured?: boolean;
  skipped?: string;
  error?: string;
  verification?: { type: string; domain: string; value: string }[];
  dns: { type: string; name: string; value: string; note: string };
}

export interface GymBrief {
  id: string;
  name: string;
  slug: string;
  plan: string | null;
  currentPeriodEnd: string | null;
}

export interface Overview {
  gyms: { total: number; active: number; suspended: number };
  subscriptions: Record<string, number>;
  expiring_within_30_days: number;
  mrr: { currency: string; amount: number; gyms: number }[];
  /** The plans' currency (PKR when there are none): what an empty MRR is shown in. */
  currency?: string;
  attention?: { renewing: GymBrief[]; past_due: GymBrief[]; suspended: GymBrief[] };
  demo_requests_new?: number;
}

export const DEMO_REQUEST_STATUSES = ["new", "contacted", "converted", "closed"] as const;
export type DemoRequestStatus = (typeof DEMO_REQUEST_STATUSES)[number];

/** How far an online signup has got -- see platform/models/demoRequestModel.js. */
export type SignupState = "awaiting_payment" | "provisioning" | "ready" | "failed";

/** What the API says about a paid signup (demoRequestsController publicRow). */
export interface DemoRequestSignup {
  state: SignupState;
  /** Whether they reached Stripe's payment page at all. */
  paymentStarted: boolean;
  /** Why the last attempt to set the gym up failed. */
  error: string;
  attempts: number;
  siteUrl: string;
  trialEndsAt: string | null;
  inviteSent: boolean;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}

export interface DemoRequest {
  id: string;
  name: string;
  /** Checkout asks for the two halves; a demo request has only `name`. */
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gymName: string;
  gymSize: string;
  country: string;
  message: string;
  source: string;
  status: DemoRequestStatus;
  notes: string;
  /**
   * "trial" came through checkout with a plan chosen; "demo" just asked;
   * "signup" chose a plan and went on to pay for it online.
   */
  kind: "demo" | "trial" | "signup";
  preferredSlug: string;
  /** What checkout worked out, priced on the server. Null for a demo ask. */
  plan: {
    slug: string;
    name: string;
    billingCycle: "monthly" | "yearly";
    addonSlugs: string[];
    addonNames: string[];
    amount: number;
    currency: string;
    trialDays: number;
  } | null;
  /** What was left off the selection and why (an add-on in another currency, say). */
  warnings?: string[];
  /** The gym it was set up as, once "Set this gym up" has created one. */
  gymId?: string | null;
  convertedAt?: string | null;
  /** How far a paid signup has got; null on a demo or trial request. */
  signup?: DemoRequestSignup | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * What can be sold on top of `plan` (none: no plan): active, not already
 * included in it, offered with it, and in its currency -- the API refuses
 * any other add-on with "Not available on this plan".
 */
export function addonsSoldWith(plan: Plan | undefined, addons: Addon[]): Addon[] {
  const included = plan?.includedAddons || [];
  return addons.filter(
    (a) => a.isActive && !included.includes(a.slug) && (!a.planSlugs.length || a.planSlugs.includes(plan?.slug || "")) && (!plan || a.price.currency === plan.price.currency)
  );
}

/**
 * Moving a selection of add-ons to another plan: the ones it still sells
 * stay chosen, the rest come off -- sent anyway, they would have the whole
 * save refused -- and `message` names them (null when none came off), so the
 * admin knows the bill changed.
 */
export function keepAddonsFor(plan: Plan | undefined, addons: Addon[], slugs: string[]): { slugs: string[]; message: string | null } {
  const sold = addonsSoldWith(plan, addons).map((a) => a.slug);
  const kept = slugs.filter((slug) => sold.includes(slug));
  const dropped = slugs.filter((slug) => !sold.includes(slug));
  if (!dropped.length) return { slugs: kept, message: null };
  const nameOf = (slug: string) => addons.find((a) => a.slug === slug)?.name || slug;
  const included = dropped.filter((slug) => (plan?.includedAddons || []).includes(slug));
  const notSold = dropped.filter((slug) => !included.includes(slug));
  const parts = [
    notSold.length ? `${notSold.map(nameOf).join(", ")} ${notSold.length === 1 ? "is" : "are"} not sold ${plan ? `with ${plan.name}` : "without a plan"}` : "",
    included.length && plan ? `${included.map(nameOf).join(", ")} ${included.length === 1 ? "comes" : "come"} with ${plan.name} at no charge` : "",
  ].filter(Boolean);
  return { slugs: kept, message: `Removed from the add-ons: ${parts.join("; ")}.` };
}

export function planOf(gym: Gym): Plan | null {
  return gym.plan && typeof gym.plan === "object" ? (gym.plan as Plan) : null;
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** What the platform sells in when nothing says otherwise: it sells in Pakistan. */
export const DEFAULT_CURRENCY = "PKR";

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || DEFAULT_CURRENCY, maximumFractionDigits: 0 }).format(amount || 0);
  } catch {
    return `${currency} ${amount}`;
  }
}

export const SUBSCRIPTION_STATUSES = ["trialing", "active", "past_due", "expired", "cancelled"] as const;
export const BILLING_CYCLES = ["monthly", "yearly"] as const;

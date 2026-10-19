"use client";

// Payments: how gyms pay GymsPilotPro for their plan, one card per question,
// laid out like a gym's own Settings → Payments:
//   1. How gyms pay you (one way at a time).
//   2. Connect it: Safepay's or Stripe's keys, or GymsPilotPro's bank accounts.
//   3. Reminders to gym owners, before and after the due date.
// The choice, the keys and the reminders are saved together by the bar at
// the bottom (PUT /settings); a bank account is saved from its own window.
//
// The ways come from GET /settings/payment-gateways with the fields each
// form needs; the plain names and hints below are for the ones we know.
// This page took over System → Stripe (that address leads here).

import { useCallback, useEffect, useRef, useState, type ComponentType, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { FiCheck, FiCheckCircle, FiCopy, FiCreditCard, FiEdit3, FiSmartphone } from "react-icons/fi";
import { LuLandmark } from "react-icons/lu";
import { Alert, Button, Input, PageHeader, Pill, Select, Spinner, Toggle, cx, relativeTime, useAsyncAction } from "../_shared/ui";
import { formatDate, isMaskedSecret, platformFetch, type PlatformBankAccount, type PlatformGateway, type PlatformGatewayField } from "../_shared/api";
import BankAccounts from "./BankAccounts";

/* ---------------------------------- data --------------------------------- */

interface StripeView {
  enabled: boolean;
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  secretKeySet: boolean;
  webhookSecretSet: boolean;
  mode: "" | "test" | "live";
  accountName: string;
  accountId: string;
  livemode: boolean;
  checkedAt: string | null;
}

interface SafepayView {
  enabled?: boolean;
  environment?: string;
  publicKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  secretKeySet?: boolean;
  webhookSecretSet?: boolean;
  /** Where Safepay sends its payment updates (read-only). */
  webhook_url?: string;
}

interface Reminders {
  daysBefore: number[];
  onDueDay: boolean;
  lastDayAfterDue: number;
}

/** GET /settings. */
interface PaymentSettings {
  stripe: StripeView;
  /** Where Stripe sends its events (read-only). */
  webhookUrl: string;
  onlinePayments?: { provider?: string };
  safepay?: SafepayView;
  bankAccounts?: PlatformBankAccount[];
  billingReminders?: Partial<Reminders>;
  updatedByEmail: string;
  updatedAt: string | null;
}

/** One platform_stripe_event row from GET /audit. */
interface StripeEventRow {
  _id: string;
  gymId?: string | null;
  gymSlug: string;
  meta: { type?: string; id?: string; livemode?: boolean; result?: string } | null;
  createdAt: string;
}

type GatewayValues = Record<string, unknown>;

/** What the Save bar sends. */
interface FormState {
  provider: string;
  gateways: Record<string, GatewayValues>;
  reminders: Reminders;
}

const NONE = "none";
const BANK = "generic";

const REMINDER_DEFAULTS: Reminders = { daysBefore: [3], onDueDay: true, lastDayAfterDue: 3 };

/** What the platform's Stripe webhook acts on. */
const STRIPE_EVENTS = ["checkout.session.completed", "invoice.paid", "invoice.payment_failed", "customer.subscription.updated", "customer.subscription.deleted"];

interface OptionCopy {
  title: string;
  short: string;
  line: string;
  icon: ComponentType<{ className?: string }>;
  fields?: Record<string, { label?: string; hint?: string; placeholder?: string }>;
  webhookHow?: string;
  webhookEvents?: string[];
}

const COPY: Record<string, OptionCopy> = {
  [BANK]: { title: "Bank transfer + receipt", short: "bank transfer", line: "Gyms upload a receipt, you approve.", icon: LuLandmark },
  safepay: {
    title: "Safepay (Pakistan)",
    short: "Safepay",
    line: "Card, JazzCash, Easypaisa or bank apps.",
    icon: FiSmartphone,
    fields: {
      publicKey: { label: "Public key", hint: "Safepay → Developer → API" },
      secretKey: { label: "Secret key", hint: "Safepay → Developer → API" },
      webhookSecret: { label: "Webhook secret", hint: "Safepay → Developer → Endpoints → shared secret" },
    },
    webhookHow: "In Safepay: Developer → Endpoints → Add endpoint, paste this.",
  },
  stripe: {
    title: "Stripe (international)",
    short: "Stripe",
    line: "Card payments worldwide.",
    icon: FiCreditCard,
    fields: {
      publishableKey: { label: "Publishable key", hint: "Stripe → Developers → API keys", placeholder: "pk_live_…" },
      secretKey: { label: "Secret key", hint: "Stripe → Developers → API keys", placeholder: "sk_live_…" },
      webhookSecret: { label: "Signing secret", hint: "Stripe → Developers → Webhooks → your endpoint", placeholder: "whsec_…" },
    },
    webhookHow: "In Stripe: Developers → Webhooks → Add endpoint, paste this.",
    webhookEvents: STRIPE_EVENTS,
  },
  [NONE]: { title: "None", short: "none", line: "You record payments by hand.", icon: FiEdit3 },
};

// Bank transfer first: it needs no account with anyone.
const ORDER: Record<string, number> = { [BANK]: 0, safepay: 1, stripe: 2 };

// Used while the API cannot list its gateways, with the fields the spec gives them.
const BUILT_IN: PlatformGateway[] = [
  { id: BANK, label: "Bank transfer", config_fields: [] },
  {
    id: "safepay",
    label: "Safepay",
    config_fields: [
      { name: "environment", label: "Environment", type: "select", required: true, options: [{ value: "sandbox", label: "Sandbox" }, { value: "production", label: "Production" }] },
      { name: "publicKey", label: "Public key", type: "text", required: true },
      { name: "secretKey", label: "Secret key", type: "secret", required: true },
      { name: "webhookSecret", label: "Webhook secret", type: "secret", required: true },
    ],
  },
  {
    id: "stripe",
    label: "Stripe",
    config_fields: [
      { name: "publishableKey", label: "Publishable key", type: "text", required: true },
      { name: "secretKey", label: "Secret key", type: "secret", required: true },
      { name: "webhookSecret", label: "Webhook signing secret", type: "secret", required: true },
    ],
  },
];

const copyFor = (g: PlatformGateway): OptionCopy => COPY[g.id] || { title: g.label, short: g.label, line: g.description || "", icon: FiCreditCard };

/** The fields a form shows: never the gateway's own on/off, which choosing it sets. */
const fieldsOf = (g: PlatformGateway) => (g.config_fields || []).filter((f) => !(f.type === "boolean" && f.name === "enabled"));

const optionList = (f: PlatformGatewayField) => (f.options || []).map((o) => (typeof o === "string" ? { value: o, label: o } : o));

const TEST_MODE = /^(sandbox|test)$/i;
const LIVE_MODE = /^(production|live)$/i;

/** A choice between test and real payments (Safepay's environment): a Test / Live switch. */
function isModeField(f: PlatformGatewayField) {
  if (f.type !== "select") return false;
  const values = optionList(f).map((o) => o.value);
  return values.some((v) => TEST_MODE.test(v)) && values.some((v) => LIVE_MODE.test(v));
}

function sortGateways(list: PlatformGateway[]) {
  return list
    .filter((g) => g.id !== NONE)
    .map((g, i) => ({ g, i }))
    .sort((a, b) => (ORDER[a.g.id] ?? 9) - (ORDER[b.g.id] ?? 9) || a.i - b.i)
    .map(({ g }) => g);
}

function formFrom(s: PaymentSettings, gateways: PlatformGateway[], selected?: string | null): FormState {
  const blocks = s as unknown as Record<string, GatewayValues | undefined>;
  const values: Record<string, GatewayValues> = {};
  for (const g of gateways) {
    if (g.id === BANK) continue;
    const block = blocks[g.id] || {};
    const v: GatewayValues = { enabled: block.enabled === true };
    for (const f of fieldsOf(g)) {
      const stored = block[f.name];
      if (f.type === "boolean") v[f.name] = stored === true;
      else if (typeof stored === "string" && stored !== "") v[f.name] = stored;
      else if (isModeField(f)) v[f.name] = optionList(f).find((o) => TEST_MODE.test(o.value))?.value || "";
      else v[f.name] = typeof stored === "number" ? String(stored) : "";
    }
    values[g.id] = v;
  }
  const r = s.billingReminders || {};
  return {
    // Never chosen: Stripe when it is switched on (as before this page), otherwise none.
    provider: s.onlinePayments?.provider || selected || (s.stripe?.enabled ? "stripe" : NONE),
    gateways: values,
    reminders: {
      daysBefore: Array.isArray(r.daysBefore) ? r.daysBefore : REMINDER_DEFAULTS.daysBefore,
      onDueDay: typeof r.onDueDay === "boolean" ? r.onDueDay : REMINDER_DEFAULTS.onDueDay,
      lastDayAfterDue: typeof r.lastDayAfterDue === "number" ? r.lastDayAfterDue : REMINDER_DEFAULTS.lastDayAfterDue,
    },
  };
}

/** A gateway's keys without its on/off: what a test runs against. */
const keysOnly = (v: GatewayValues | undefined) => JSON.stringify(Object.entries(v || {}).filter(([k]) => k !== "enabled"));

/** "7, 3" as the days to send a reminder, or null when it cannot be read. */
function parseDays(text: string): number[] | null {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (!parts.length) return [];
  const days = parts.map((p) => (/^\d+$/.test(p) ? Number(p) : NaN));
  if (days.some((d) => !Number.isInteger(d) || d < 0 || d > 30)) return null;
  return Array.from(new Set(days)).sort((a, b) => b - a);
}

/** "Example: due on 16 Oct → emails on 13 Oct, 16 Oct and 19 Oct." */
function exampleLine(daysBefore: number[], onTheDay: boolean, daysAfter: number) {
  const now = new Date();
  const due = new Date(now.getFullYear(), now.getMonth(), 16);
  const offsets = new Set<number>(daysBefore.map((d) => -d));
  if (onTheDay) offsets.add(0);
  if (daysAfter > 0) offsets.add(daysAfter);
  const day = (offset: number) => {
    const d = new Date(due);
    d.setDate(due.getDate() + offset);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };
  const dates = Array.from(offsets)
    .sort((a, b) => a - b)
    .map(day);
  if (!dates.length) return "No reminders are sent.";
  const joined = dates.length === 1 ? dates[0] : `${dates.slice(0, -1).join(", ")} and ${dates[dates.length - 1]}`;
  return `Example: due on ${day(0)} → email${dates.length === 1 ? "" : "s"} on ${joined}.`;
}

/* ------------------------------- small parts ------------------------------ */

function Card({ children }: { children: ReactNode }) {
  return <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">{children}</section>;
}

/** A card's header: its number, a title and one short line. */
function CardHead({ step, title, line, aside }: { step: number; title: string; line?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-4 sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white" aria-hidden="true">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-7 text-neutral-900">{title}</h2>
          {line && <p className="text-sm text-neutral-500">{line}</p>}
        </div>
      </div>
      {aside && <div className="flex shrink-0 items-center pt-1">{aside}</div>}
    </header>
  );
}

function CardFoot({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-neutral-100 bg-neutral-50/60 px-4 py-4 sm:px-6">{children}</div>;
}

function Tag({ tone, children }: { tone: "good" | "warn" | "neutral"; children: ReactNode }) {
  return (
    <Pill tone={tone} dot={false}>
      <span className="normal-case">{children}</span>
    </Pill>
  );
}

/** A read-only address with a Copy button and one line on where it goes. */
function CopyBox({ label, text, how }: { label: string; text: string; how?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  };
  return (
    <div>
      <p className="text-xs font-semibold text-neutral-700">{label}</p>
      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 pl-3 pr-1.5">
        <code className="min-w-0 flex-1 select-all break-all font-mono text-xs text-neutral-800">{text}</code>
        <Button variant="secondary" size="sm" onClick={copy}>
          {state === "copied" ? <FiCheck className="h-3.5 w-3.5" /> : <FiCopy className="h-3.5 w-3.5" />} {state === "copied" ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className={cx("mt-1.5 text-xs", state === "failed" ? "text-rose-700" : "text-neutral-500")}>{state === "failed" ? "Your browser would not copy. Select the address and copy it by hand." : how}</p>
    </div>
  );
}

/* ---------------------------------- page --------------------------------- */

export default function PlatformPaymentsPage() {
  const [server, setServer] = useState<PaymentSettings | null>(null);
  const [gateways, setGateways] = useState<PlatformGateway[] | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saved, setSaved] = useState<FormState | null>(null);
  const [daysText, setDaysText] = useState("3");
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<StripeEventRow[] | null>(null);
  const action = useAsyncAction();
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; text: string } | null>(null);
  // The last Save pressed, as it was: still unsaved and unchanged since means it failed.
  const [attempt, setAttempt] = useState<string | null>(null);

  const list = sortGateways(gateways && gateways.length ? gateways : BUILT_IN);

  const fetchGateways = useCallback(async () => {
    try {
      const res = await platformFetch<{ data?: PlatformGateway[]; selected?: string }>("/settings/payment-gateways");
      return { list: Array.isArray(res.data) ? res.data : [], selected: res.selected || res.data?.find((g) => g.selected)?.id || null };
    } catch {
      // An API without the list yet: the page falls back to the built-in ways.
      return { list: [] as PlatformGateway[], selected: null };
    }
  }, []);

  const hydrate = useCallback((s: PaymentSettings, g: { list: PlatformGateway[]; selected: string | null }) => {
    const ways = sortGateways(g.list.length ? g.list : BUILT_IN);
    const next = formFrom(s, ways, g.selected);
    setServer(s);
    setGateways(g.list);
    setForm(next);
    setSaved(next);
    setDaysText(next.reminders.daysBefore.join(", "));
  }, []);

  const load = useCallback(async () => {
    try {
      const [settings, g] = await Promise.all([platformFetch<{ data: PaymentSettings }>("/settings"), fetchGateways()]);
      hydrate(settings.data, g);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the settings");
    }
  }, [fetchGateways, hydrate]);

  useEffect(() => {
    load();
  }, [load]);

  const provider = form?.provider || NONE;
  const selected = list.find((g) => g.id === provider) || null;

  // The last few things Stripe sent, from the audit log; only while Stripe is the way. Best effort.
  useEffect(() => {
    if (provider !== "stripe" || events !== null) return;
    platformFetch<{ data: StripeEventRow[] }>("/audit?action=platform_stripe_event&limit=10")
      .then((res) => setEvents(res.data))
      .catch(() => setEvents([]));
  }, [provider, events]);

  useEffect(() => setTestResult(null), [provider]);

  // ---- the tiles: a radio group, arrow keys move the choice ----
  const tileRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  if (!server || !form || !saved) {
    if (error) {
      return (
        <>
          <Alert tone="error">{error}</Alert>
          <Button variant="secondary" loading={action.pending === "reload"} onClick={() => action.run("reload", load)}>
            Try again
          </Button>
        </>
      );
    }
    return <Spinner />;
  }

  const banks = server.bankAccounts || [];
  const banksReady = banks.some((b) => b.active !== false);

  // Ready to take payments, as the API says; worked out here while it cannot list its ways.
  const configured = (g: PlatformGateway) => {
    if (typeof g.configured === "boolean") return g.configured;
    if (g.id === "stripe") return server.stripe.secretKeySet && server.stripe.webhookSecretSet;
    const sp = server.safepay || {};
    if (g.id === "safepay") return !!sp.publicKey && !!sp.secretKeySet && !!sp.webhookSecretSet;
    return false;
  };

  const choose = (id: string) =>
    setForm((f) => {
      if (!f) return f;
      // The chosen way takes every new payment, so choosing it switches it
      // on; the others go back to how they were saved (not off: gyms still on
      // a Stripe subscription renew through its webhook).
      const next: Record<string, GatewayValues> = {};
      for (const [key, v] of Object.entries(f.gateways)) {
        next[key] = { ...v, enabled: key === id ? true : saved.gateways[key]?.enabled === true };
      }
      return { ...f, provider: id, gateways: next };
    });

  const setField = (id: string, name: string, value: unknown) =>
    setForm((f) => (f ? { ...f, gateways: { ...f.gateways, [id]: { ...(f.gateways[id] || {}), [name]: value } } } : f));

  const setReminders = (patch: Partial<Reminders>) => setForm((f) => (f ? { ...f, reminders: { ...f.reminders, ...patch } } : f));

  const options = [
    ...list.map((g) => {
      const c = copyFor(g);
      const tag =
        g.id === BANK
          ? banksReady
            ? { tone: "good" as const, text: "Ready" }
            : { tone: "warn" as const, text: "Add a bank account" }
          : configured(g)
          ? { tone: "good" as const, text: "Ready" }
          : { tone: "neutral" as const, text: "Needs setup" };
      return { id: g.id, title: c.title, line: c.line, icon: c.icon, tag };
    }),
    { id: NONE, title: COPY[NONE].title, line: COPY[NONE].line, icon: COPY[NONE].icon, tag: null },
  ];

  const onTileKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const move = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!move) return;
    e.preventDefault();
    const next = options[(index + move + options.length) % options.length];
    choose(next.id);
    tileRefs.current[next.id]?.focus();
  };

  // ---- reminders ----
  const parsedDays = parseDays(daysText);
  const lastDay = form.reminders.lastDayAfterDue;
  const lastDayBad = !Number.isInteger(lastDay) || lastDay < 0 || lastDay > 60;
  const remindersBad = parsedDays === null || lastDayBad;

  // ---- save ----
  const snapshot = (s: FormState) => JSON.stringify(s);
  const dirty = snapshot(form) !== snapshot(saved);
  const saving = action.pending === "save";
  const saveFailed = dirty && !saving && attempt === snapshot(form);

  const save = () =>
    action.run("save", async () => {
      if (remindersBad) return;
      setError(null);
      setAttempt(snapshot(form));
      try {
        const res = await platformFetch<{ data: PaymentSettings }>("/settings", {
          method: "PUT",
          body: {
            onlinePayments: { provider: form.provider },
            // A secret not retyped goes back as its masked preview, which the
            // API knows to leave alone.
            ...form.gateways,
            billingReminders: form.reminders,
          },
        });
        hydrate(res.data, await fetchGateways());
        setAttempt(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });

  // ---- test connection ----
  const test = (g: PlatformGateway) =>
    action.run(`test:${g.id}`, async () => {
      setTestResult(null);
      const name = copyFor(g).short;
      try {
        const res = await platformFetch<{ success?: boolean; message?: string }>(`/settings/${encodeURIComponent(g.id)}/test`, { method: "POST" });
        setTestResult(res.success === false ? { id: g.id, ok: false, text: res.message || "The keys did not work." } : { id: g.id, ok: true, text: res.message || `Connected — ${name} accepted the keys.` });
        // Stripe remembers which account answered: show it, keeping any edits.
        if (g.id === "stripe") {
          platformFetch<{ data: PaymentSettings }>("/settings")
            .then((r) => setServer(r.data))
            .catch(() => {});
        }
      } catch (e) {
        setTestResult({ id: g.id, ok: false, text: e instanceof Error ? e.message : "The test could not run." });
      }
    });

  // ---- the keys form: Safepay, Stripe, or any gateway the API adds ----
  const keysForm = (g: PlatformGateway) => {
    const c = copyFor(g);
    const values = form.gateways[g.id] || {};
    const block = ((server as unknown as Record<string, GatewayValues | undefined>)[g.id] || {}) as GatewayValues;
    const fields = fieldsOf(g.config_fields?.length ? g : BUILT_IN.find((b) => b.id === g.id) || g);
    const modeField = fields.find(isModeField);
    const webhookFields = fields.filter((f) => f !== modeField && /webhook/i.test(f.name));
    const keyFields = fields.filter((f) => f !== modeField && !webhookFields.includes(f));
    const webhookUrl = String((g.id === "stripe" ? server.webhookUrl : block.webhook_url) || "");
    const unsaved = keysOnly(values) !== keysOnly(saved.gateways[g.id]);
    const testing = action.pending === `test:${g.id}`;
    const result = testResult?.id === g.id ? testResult : null;
    const stripe = g.id === "stripe" ? server.stripe : null;

    const field = (f: PlatformGatewayField) => {
      const label = c.fields?.[f.name]?.label || f.label;
      const hint = c.fields?.[f.name]?.hint || f.help;
      const value = values[f.name];
      if (f.type === "boolean") {
        return (
          <div key={f.name} className="sm:col-span-2">
            <Toggle label={label} hint={hint} checked={value === true} onChange={(v) => setField(g.id, f.name, v)} />
          </div>
        );
      }
      if (f.type === "select") {
        return (
          <label key={f.name} className="block">
            <span className="text-xs font-semibold text-neutral-700">{label}</span>
            <Select className="mt-1.5" value={String(value || "")} onChange={(e) => setField(g.id, f.name, e.target.value)}>
              <option value="">Choose…</option>
              {optionList(f).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            {hint && <span className="mt-1.5 block text-xs text-neutral-500">{hint}</span>}
          </label>
        );
      }
      const secret = f.type === "secret";
      const isSaved = secret && (isMaskedSecret(value) || block[`${f.name}Set`] === true) && value === saved.gateways[g.id]?.[f.name];
      return (
        <label key={f.name} className="block">
          <span className="text-xs font-semibold text-neutral-700">{label}</span>
          <Input
            className="mt-1.5 font-mono"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setField(g.id, f.name, e.target.value)}
            // A masked secret is selected on focus, so typing replaces it
            // rather than adding to the dots (which the API would ignore).
            onFocus={(e) => isMaskedSecret(e.target.value) && e.target.select()}
            placeholder={c.fields?.[f.name]?.placeholder}
            spellCheck={false}
            autoComplete="off"
          />
          {isSaved ? (
            <span className="mt-1.5 flex items-center gap-1 text-xs text-emerald-700">
              <FiCheck className="h-3.5 w-3.5" aria-hidden="true" /> Saved. Type a new one to replace it.
            </span>
          ) : (
            hint && <span className="mt-1.5 block text-xs text-neutral-500">{hint}</span>
          )}
        </label>
      );
    };

    const modeOptions = modeField ? optionList(modeField) : [];
    const modeValue = modeField ? String(values[modeField.name] || "") : "";
    const live = LIVE_MODE.test(modeValue);

    return (
      <>
        <div className="space-y-6 px-4 py-5 sm:px-6">
          {modeField && (
            <div>
              <div role="radiogroup" aria-label="Test or live payments" className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
                {modeOptions.map((o) => {
                  const on = modeValue === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setField(g.id, modeField.name, o.value)}
                      className={cx(
                        "rounded-md px-4 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
                        on ? (LIVE_MODE.test(o.value) ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200") : "text-neutral-500 hover:text-neutral-800"
                      )}
                    >
                      {TEST_MODE.test(o.value) ? "Test" : LIVE_MODE.test(o.value) ? "Live" : o.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-neutral-500">{live ? "Real payments." : "Test payments only — no real money."}</p>
            </div>
          )}

          {keyFields.length > 0 && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{keyFields.map(field)}</div>}

          {(webhookUrl || webhookFields.length > 0) && (
            <div className="space-y-4 border-t border-neutral-100 pt-5">
              {webhookUrl && <CopyBox label="Webhook address" text={webhookUrl} how={c.webhookHow || `In ${c.short}, add this as a webhook endpoint.`} />}
              {c.webhookEvents && (
                <details className="text-xs text-neutral-500">
                  <summary className="cursor-pointer font-medium text-neutral-700">Events to send ({c.webhookEvents.length})</summary>
                  <p className="mt-1 break-words font-mono">{c.webhookEvents.join(", ")}</p>
                </details>
              )}
              {webhookFields.length > 0 && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{webhookFields.map(field)}</div>}
            </div>
          )}

          {stripe && (
            <div className="space-y-3 border-t border-neutral-100 pt-5 text-sm">
              {stripe.accountId ? (
                <p className="flex flex-wrap items-center gap-2 text-emerald-700">
                  <FiCheckCircle className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">{stripe.accountName}</span>
                  {stripe.mode && <Tag tone={stripe.mode === "live" ? "good" : "neutral"}>{stripe.mode === "live" ? "Live keys" : "Test keys"}</Tag>}
                  {stripe.checkedAt && <span className="text-xs text-neutral-500">checked {formatDate(stripe.checkedAt)}</span>}
                </p>
              ) : (
                <p className="text-xs text-neutral-500">{stripe.secretKeySet ? "Not tested yet." : "No secret key saved yet."}</p>
              )}
              <details className="text-xs">
                <summary className="cursor-pointer font-medium text-neutral-700">Recent webhook events</summary>
                {events === null ? (
                  <p className="mt-2 text-neutral-500">Loading…</p>
                ) : events.length === 0 ? (
                  <p className="mt-2 text-neutral-500">Nothing has arrived yet.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-neutral-100 rounded-lg border border-neutral-200">
                    {events.map((row) => (
                      <li key={row._id} className="px-3 py-2">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-neutral-800">{row.meta?.type || "event"}</span>
                          {row.meta?.livemode === false && <Tag tone="neutral">test</Tag>}
                          <span className="text-neutral-400">{relativeTime(row.createdAt)}</span>
                        </p>
                        <p className="mt-0.5 text-neutral-500">
                          {row.meta?.result || "received"}
                          {row.gymSlug && (
                            <>
                              {" · "}
                              {row.gymId ? (
                                <Link href={`/super-admin/gyms/${row.gymId}`} className="font-mono text-indigo-600 hover:underline">
                                  {row.gymSlug}
                                </Link>
                              ) : (
                                <span className="font-mono">{row.gymSlug}</span>
                              )}
                            </>
                          )}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </div>
          )}
        </div>
        <CardFoot>
          <Button variant="secondary" onClick={() => test(g)} loading={testing} disabled={action.busy || unsaved}>
            {testing ? "Testing…" : "Test connection"}
          </Button>
          {result ? (
            <p role={result.ok ? "status" : "alert"} className={cx("text-sm font-medium", result.ok ? "text-emerald-700" : "text-rose-700")}>
              {result.text}
            </p>
          ) : (
            unsaved && <p className="text-xs text-neutral-500">Save first, then test.</p>
          )}
        </CardFoot>
      </>
    );
  };

  const bankOption = selected?.id === BANK;
  const remindersStep = selected ? 3 : 2;
  const selectedCopy = selected ? copyFor(selected) : COPY[NONE];

  return (
    <div>
      <PageHeader eyebrow="System" title="Payments" description="How gyms pay GymsPilotPro for their plan." />

      {error && (
        <Alert tone="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="space-y-6">
        {/* ---- 1. How gyms pay you ---- */}
        <Card>
          <CardHead step={1} title="How gyms pay you" line="Pick one." />
          <div className="px-4 py-5 sm:px-6">
            <div role="radiogroup" aria-label="How gyms pay you" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {options.map((o, index) => {
                const active = o.id === provider;
                const Icon = o.icon;
                return (
                  <button
                    key={o.id}
                    ref={(el) => {
                      tileRefs.current[o.id] = el;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    tabIndex={active ? 0 : -1}
                    onClick={() => choose(o.id)}
                    onKeyDown={(e) => onTileKey(e, index)}
                    className={cx(
                      "flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2",
                      active ? "border-neutral-900 bg-white" : "border-neutral-200 bg-white hover:border-neutral-300"
                    )}
                  >
                    <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", active ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600")} aria-hidden="true">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-[15px] font-semibold leading-5 text-neutral-900">{o.title}</span>
                        <span className={cx("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", active ? "border-neutral-900" : "border-neutral-300")} aria-hidden="true">
                          {active && <span className="h-2.5 w-2.5 rounded-full bg-neutral-900" />}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm text-neutral-500">{o.line}</span>
                      {o.tag && (
                        <span className="mt-2 block">
                          <Tag tone={o.tag.tone}>{o.tag.text}</Tag>
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Connect and Reminders side by side on a wide screen; Reminders
            alone (no way chosen) keeps a readable width. */}
        <div className={cx("grid items-start gap-6", selected ? "xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : "xl:grid-cols-2")}>
          {/* ---- 2. Connect the chosen way ---- */}
          {selected && (
            <Card>
              {bankOption ? (
                <>
                  <CardHead
                    step={2}
                    title="Your bank accounts"
                    line="Gyms see these and the QR code when they pay."
                    aside={<Tag tone={banksReady ? "good" : "warn"}>{banksReady ? "Ready" : "Add a bank account"}</Tag>}
                  />
                  <div className="px-4 py-5 sm:px-6">
                    <BankAccounts accounts={banks} onChange={(next) => setServer((s) => (s ? { ...s, bankAccounts: next } : s))} />
                  </div>
                  <CardFoot>
                    <Link href="/super-admin/payment-requests" className="text-sm font-semibold text-indigo-600 underline-offset-4 hover:text-indigo-700 hover:underline">
                      Payments to verify →
                    </Link>
                  </CardFoot>
                </>
              ) : (
                <>
                  <CardHead
                    step={2}
                    title={`Connect ${selectedCopy.short}`}
                    line="Paste the keys, then Save."
                    aside={<Tag tone={configured(selected) ? "good" : "neutral"}>{configured(selected) ? "Ready" : "Needs setup"}</Tag>}
                  />
                  {keysForm(selected)}
                </>
              )}
            </Card>
          )}

          {/* ---- 3. Reminders to gym owners ---- */}
          <Card>
            <CardHead step={remindersStep} title="Reminders to gym owners" line="Emailed before and after the due date." />
            <div className="space-y-5 px-4 py-5 sm:px-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-800">
                  <span>Send a reminder</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={daysText}
                    onChange={(e) => {
                      // What is typed stays as typed (commas and all); the list
                      // is kept once it reads as one.
                      const v = e.target.value;
                      setDaysText(v);
                      const days = parseDays(v);
                      if (days) setReminders({ daysBefore: days });
                    }}
                    placeholder="3"
                    aria-label="Days before the due date"
                    title="One or more days, separated by commas (for example 7, 3)"
                    aria-invalid={parsedDays === null || undefined}
                    className={cx(
                      "h-9 w-16 rounded-lg border bg-white px-2 text-center text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm",
                      parsedDays === null ? "border-rose-400" : "border-neutral-200"
                    )}
                  />
                  <span>days before the due date</span>
                </div>
                {parsedDays === null && (
                  <p role="alert" className="mt-1 text-xs text-rose-700">
                    Use whole days from 0 to 30, like 7, 3.
                  </p>
                )}
              </div>

              <Toggle label="Also on the due date" checked={form.reminders.onDueDay} onChange={(v) => setReminders({ onDueDay: v })} />

              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-800">
                  <span>Final reminder</span>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={Number.isFinite(lastDay) ? lastDay : ""}
                    onChange={(e) => setReminders({ lastDayAfterDue: e.target.value.trim() === "" ? 0 : Number(e.target.value) })}
                    aria-label="Days after the due date"
                    aria-invalid={lastDayBad || undefined}
                    className={cx(
                      "h-9 w-16 rounded-lg border bg-white px-2 text-center text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm",
                      lastDayBad ? "border-rose-400" : "border-neutral-200"
                    )}
                  />
                  <span>days after</span>
                  <span className="text-xs text-neutral-400">(0 = off)</span>
                </div>
                {lastDayBad && (
                  <p role="alert" className="mt-1 text-xs text-rose-700">
                    Use a whole number from 0 to 60.
                  </p>
                )}
              </div>

              <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">{exampleLine(parsedDays ?? form.reminders.daysBefore, form.reminders.onDueDay, lastDayBad ? 0 : lastDay)}</p>
              <p className="text-xs text-neutral-500">Sent only when platform email (SMTP) is set up on the server.</p>
            </div>
          </Card>
        </div>

        {/* ---- Save: one Save for the choice, the keys and the reminders ---- */}
        <div className="sticky bottom-0 z-10 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur sm:px-5">
            <p role="status" className={cx("text-sm", remindersBad || saveFailed ? "text-rose-700" : dirty ? "font-medium text-amber-700" : "text-neutral-500")}>
              {remindersBad
                ? "Fix the reminder days to save."
                : saveFailed
                ? "Not saved. See the message at the top."
                : dirty
                ? "You have unsaved changes."
                : "All changes saved."}
            </p>
            <Button onClick={save} loading={saving} disabled={(action.busy && !saving) || remindersBad || !dirty}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

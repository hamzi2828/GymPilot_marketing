"use client";

// Provisioning a gym: platform record, its own database, system roles,
// settings, homepage, legal pages and the owner's administrator account --
// one form, one request.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiDatabase, FiGlobe, FiUser } from "react-icons/fi";
import { PageHeader, Crumbs, Panel, Button, Field, Input, Select, Textarea, Alert, useAsyncAction } from "../../_shared/ui";
import { platformFetch, addonsSoldWith, keepAddonsFor, type Addon, type DemoRequest, type Plan, type Gym, type PlatformConfig } from "../../_shared/api";

const COMMON_TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Manila",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
];

// Where a new gym is assumed to be until the form says otherwise: GymsPilotPro
// sells in Pakistan. The currency follows the plans' own once they have
// loaded (see below), so a price list in another currency moves it.
const DEFAULT_TIMEZONE = "Asia/Karachi";
const DEFAULT_CURRENCY = "PKR";

// What a request's free-text "City / country" says about the gym's own money
// and clock -- what it charges its members in, not what it pays us in.
// Matched on words, so "Karachi, Pakistan" and "Lahore" both land on PK.
const PLACE_LOCALES: { match: RegExp; country: string; currency: string; timezone: string }[] = [
  { match: /\b(pakistan|karachi|lahore|islamabad|rawalpindi|faisalabad|multan|peshawar)\b/i, country: "PK", currency: "PKR", timezone: "Asia/Karachi" },
  { match: /\b(uk|united kingdom|great britain|britain|england|scotland|wales|london|manchester|birmingham|leeds|glasgow|edinburgh)\b/i, country: "GB", currency: "GBP", timezone: "Europe/London" },
  { match: /\b(uae|united arab emirates|dubai|abu dhabi|sharjah)\b/i, country: "AE", currency: "AED", timezone: "Asia/Dubai" },
  { match: /\b(saudi arabia|saudi|ksa|riyadh|jeddah|dammam)\b/i, country: "SA", currency: "SAR", timezone: "Asia/Riyadh" },
  { match: /\b(qatar|doha)\b/i, country: "QA", currency: "QAR", timezone: "Asia/Qatar" },
  { match: /\b(india|mumbai|delhi|bangalore|bengaluru)\b/i, country: "IN", currency: "INR", timezone: "Asia/Kolkata" },
  { match: /\b(bangladesh|dhaka)\b/i, country: "BD", currency: "BDT", timezone: "Asia/Dhaka" },
  { match: /\b(ireland|dublin)\b/i, country: "IE", currency: "EUR", timezone: "Europe/Dublin" },
  { match: /\b(germany|berlin|munich)\b/i, country: "DE", currency: "EUR", timezone: "Europe/Berlin" },
  { match: /\b(france|paris)\b/i, country: "FR", currency: "EUR", timezone: "Europe/Paris" },
  { match: /\b(spain|madrid|barcelona)\b/i, country: "ES", currency: "EUR", timezone: "Europe/Madrid" },
  { match: /\b(turkey|istanbul|ankara)\b/i, country: "TR", currency: "TRY", timezone: "Europe/Istanbul" },
  { match: /\b(nigeria|lagos|abuja)\b/i, country: "NG", currency: "NGN", timezone: "Africa/Lagos" },
  { match: /\b(kenya|nairobi)\b/i, country: "KE", currency: "KES", timezone: "Africa/Nairobi" },
  { match: /\b(south africa|johannesburg|cape town|durban)\b/i, country: "ZA", currency: "ZAR", timezone: "Africa/Johannesburg" },
  { match: /\b(singapore)\b/i, country: "SG", currency: "SGD", timezone: "Asia/Singapore" },
  { match: /\b(philippines|manila)\b/i, country: "PH", currency: "PHP", timezone: "Asia/Manila" },
  { match: /\b(australia)\b/i, country: "AU", currency: "AUD", timezone: "Australia/Sydney" },
  { match: /\b(canada)\b/i, country: "CA", currency: "CAD", timezone: "America/Toronto" },
  { match: /\b(usa|united states|america)\b/i, country: "US", currency: "USD", timezone: "America/New_York" },
];

function localeFromPlace(place: string) {
  return PLACE_LOCALES.find((l) => l.match.test(place || "")) || null;
}

// Mirrors the server (provisioning.js freeSlugFrom, dbNames.js
// tenantDatabaseNameFor): a slug is at most 44 characters, and a database
// name at most 38 -- the most MongoDB Atlas's shared tiers accept -- made to
// fit by shortening the slug part, never the id that keeps it unique.
const MAX_SLUG_LENGTH = 44;
const MAX_DATABASE_NAME_LENGTH = 38;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, "");
}

function databaseNameFor(prefix: string, slug: string, id: string) {
  const tail = `_${id}`;
  const room = Math.max(0, MAX_DATABASE_NAME_LENGTH - prefix.length - tail.length);
  const base = slug.replace(/[^a-z0-9_-]/gi, "_").slice(0, room).replace(/[_-]+$/, "");
  return `${prefix}${base}${tail}`;
}

function NewGymForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Where this gym came from: a checkout or a demo request, if any.
  const fromId = params.get("from") || "";
  const [request, setRequest] = useState<DemoRequest | null>(null);
  // Why that request could not be loaded, when it could not.
  const [fromError, setFromError] = useState<string | null>(null);
  // The address they signed up with is not ours to retype; it is where the
  // sign-in details go.
  const [emailLocked, setEmailLocked] = useState(false);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [addonSlugs, setAddonSlugs] = useState<string[]>([]);
  // Which add-ons the last change of plan took off, if any.
  const [addonNote, setAddonNote] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  // The tail of the database name. Fixed for as long as the form is open.
  const [databaseId, setDatabaseId] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  // Whether the plan list has answered (even with nothing, or an error):
  // the request is only filled in after it has.
  const [plansLoaded, setPlansLoaded] = useState(false);
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const { busy, run } = useAsyncAction();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    databaseName: "",
    domains: "",
    ownerFirstName: "",
    ownerLastName: "",
    ownerEmail: "",
    ownerPhone: "",
    ownerPassword: "",
    planId: "",
    timezone: DEFAULT_TIMEZONE,
    currency: DEFAULT_CURRENCY,
    country: "",
    notes: "",
  });

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const on = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(key)(e.target.value);

  useEffect(() => {
    setDatabaseId(
      Array.from(crypto.getRandomValues(new Uint8Array(3)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  }, []);

  useEffect(() => {
    platformFetch<{ data: Plan[] }>("/plans")
      .then((res) => {
        const active = res.data.filter((p) => p.isActive);
        setPlans(active);
        // The currency the platform sells in, unless one has been typed already.
        const planCurrency = active[0]?.price.currency;
        if (planCurrency) setForm((f) => (f.currency === DEFAULT_CURRENCY ? { ...f, currency: planCurrency } : f));
      })
      .catch(() => setPlans([]))
      .finally(() => setPlansLoaded(true));
    platformFetch<{ data: Addon[] }>("/addons")
      .then((res) => setAddons(res.data.filter((a) => a.isActive)))
      .catch(() => setAddons([]));
    platformFetch<{ data: PlatformConfig }>("/config")
      .then((res) => setConfig(res.data))
      .catch(() => setConfig(null));
  }, []);

  // Filling the form in from the request they sent. Waits for the plans,
  // because the plan is stored as a slug and the form wants its id.
  const prefill = useCallback(
    (r: DemoRequest, planList: Plan[]) => {
      // Checkout stores the two halves; an older record or a demo request
      // only has the one name, which is split as a best guess.
      const [first, ...rest] = (r.name || "").trim().split(/\s+/);
      const firstName = r.firstName || first;
      const lastName = r.firstName ? r.lastName : rest.join(" ");
      const plan = r.plan ? planList.find((p) => p.slug === r.plan!.slug) : undefined;
      // The gym's own currency and clock come from where it is. The plan's
      // currency is what it pays us in, which says nothing about what it
      // charges its members.
      const place = localeFromPlace(r.country);
      setForm((f) => ({
        ...f,
        name: r.gymName || f.name,
        slug: r.preferredSlug || f.slug,
        ownerFirstName: firstName || f.ownerFirstName,
        ownerLastName: lastName || f.ownerLastName,
        ownerEmail: r.email || f.ownerEmail,
        ownerPhone: r.phone || f.ownerPhone,
        planId: plan ? plan.id : f.planId,
        currency: place ? place.currency : f.currency,
        timezone: place ? place.timezone : f.timezone,
        country: place ? place.country : f.country,
        notes: [
          `${r.kind === "signup" ? "Online signup" : r.kind === "trial" ? "Checkout" : "Demo request"} on ${new Date(r.createdAt).toLocaleDateString()}.`,
          r.country ? `Where: ${r.country}` : "",
          r.gymSize ? `Size: ${r.gymSize}` : "",
          r.message ? `They said: ${r.message}` : "",
          f.notes,
        ]
          .filter(Boolean)
          .join("\n"),
      }));
      if (r.email) setEmailLocked(true);
      // Only a plan that is still sold: one switched off since is picked by
      // hand (the notice above the form says so).
      if (r.plan && plan) {
        setBillingCycle(r.plan.billingCycle === "yearly" && plan.price.yearly > 0 ? "yearly" : "monthly");
        setAddonSlugs(r.plan.addonSlugs || []);
      }
    },
    []
  );

  useEffect(() => {
    if (!fromId || !plansLoaded || request || fromError) return;
    platformFetch<{ data: DemoRequest }>(`/demo-requests/${fromId}`)
      .then((res) => {
        setRequest(res.data);
        prefill(res.data, plans);
      })
      .catch((e) => {
        setRequest(null);
        // An empty form with no word of why would look like a form that was never asked to fill itself in.
        setFromError(e instanceof Error ? e.message : "Could not load it");
      });
  }, [fromId, plans, plansLoaded, request, fromError, prefill]);

  // A plain link can still say what to call it.
  useEffect(() => {
    const name = params.get("name");
    const slug = params.get("slug");
    if (!fromId && (name || slug)) {
      setForm((f) => ({ ...f, name: name || f.name, slug: slug || f.slug }));
    }
  }, [params, fromId]);

  const suggestedSlug = slugify(form.slug || form.name);
  // Mirrors the server: <prefix><slug>_<id>. The id is settled when the form
  // opens rather than as you type, so the name shown is the name created.
  // Without the deployment's prefix (the /config call has not answered, or
  // failed) no name is sent at all and the server picks one itself -- a
  // name without the prefix is one it refuses.
  const databaseName =
    suggestedSlug && databaseId && config?.tenant_database_prefix ? databaseNameFor(config.tenant_database_prefix, suggestedSlug, databaseId) : "";
  // Nowhere to open the site: no platform root domain and nothing typed in.
  // The server refuses such a gym; say so before the form is sent.
  const hasDomain = form.domains.split(/[\s,]+/).some((d) => d.trim());
  const noWebAddress = !!config && !config.root_domain && !hasDomain && !(config.default_tenant_slug && config.default_tenant_slug === suggestedSlug);
  // The request's plan, when it is no longer sold: somebody has to pick one.
  const requestPlanGone = !!(request?.plan && !plans.some((p) => p.slug === request.plan!.slug));
  const selectedPlan = plans.find((p) => p.id === form.planId);
  const monthlyOnly = !!selectedPlan && selectedPlan.price.yearly <= 0;
  useEffect(() => {
    if (monthlyOnly) setBillingCycle("monthly");
  }, [monthlyOnly]);
  // Only what the plan sells, in the plan's own currency: the API refuses a
  // PKR add-on on a USD plan.
  const sellableAddons = addonsSoldWith(selectedPlan, addons);
  // Another plan keeps only the add-ons it sells too, and says which came
  // off: a hidden one still sent would have the gym refused.
  // (Without a plan no add-ons are sent at all, and until the add-on list has
  // loaded there is nothing to check against.)
  const choosePlan = (planId: string) => {
    setForm((f) => ({ ...f, planId }));
    setAddonNote(null);
    if (!planId || !addons.length) return;
    const kept = keepAddonsFor(
      plans.find((p) => p.id === planId),
      addons,
      addonSlugs
    );
    setAddonSlugs(kept.slugs);
    setAddonNote(kept.message);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run("create", async (leave) => {
      setError(null);
      try {
        const res = await platformFetch<{ data: Gym; ownerInviteSent?: boolean; inviteSiteUrl?: string; warnings?: string[] }>("/gyms", {
          method: "POST",
          body: {
            // The request this came from is marked converted and linked to the gym.
            demoRequestId: request ? request.id : undefined,
            name: form.name,
            // A preference, not a decision: the address they asked for at
            // checkout if there was one, otherwise the name decides, and a
            // clash only adds a number.
            preferredSlug: form.slug || undefined,
            database: databaseName ? { name: databaseName } : undefined,
            domains: form.domains
              .split(/[\s,]+/)
              .map((d) => d.trim())
              .filter(Boolean),
            owner: {
              firstName: form.ownerFirstName,
              lastName: form.ownerLastName,
              email: form.ownerEmail,
              phone: form.ownerPhone,
              password: form.ownerPassword,
            },
            planId: form.planId || undefined,
            subscription: form.planId ? { billingCycle, addonSlugs } : undefined,
            locale: { timezone: form.timezone, currency: form.currency, country: form.country },
            notes: form.notes,
          },
        });
        // The gym page says whether the owner got their invite, and what else
        // did not go to plan.
        const query = new URLSearchParams({ invite: res.ownerInviteSent ? "sent" : "failed" });
        // Where the set-password link opens: the platform subdomain when there
        // is one, which is not always the domain shown as primary.
        if (res.inviteSiteUrl) query.set("inviteHost", res.inviteSiteUrl.replace(/^https?:\/\//, ""));
        for (const warning of res.warnings || []) query.append("warning", warning);
        // Created: busy until the gym's page has replaced this form.
        leave();
        router.replace(`/super-admin/gyms/${res.data.id}?${query.toString()}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create the gym");
      }
    });
  };

  return (
    <>
      <PageHeader eyebrow={<Crumbs items={[{ label: "Gyms", href: "/super-admin/gyms" }, { label: "New gym" }]} />} title="New gym" description="Creates the platform record, a private database, default roles, settings, homepage, legal pages and the owner's administrator account." />

      {request && (
        <Alert tone="info">
          Filled in from {request.kind === "signup" ? "the online signup" : request.kind === "trial" ? "the checkout" : "the demo request"} sent by{" "}
          <span className="font-semibold">{request.name}</span> ({request.email})
          {request.plan ? ` — ${request.plan.name}, ${request.plan.billingCycle}${request.plan.addonNames.length ? ` with ${request.plan.addonNames.join(", ")}` : ""}` : ""}. Check
          it over before you create the gym.
          {(request.warnings || []).length > 0 && <span className="mt-1 block text-xs">{request.warnings!.join(" ")}</span>}
        </Alert>
      )}
      {request && (request.gymId || request.status === "converted") && (
        <Alert tone="warning">
          This request was already set up as a gym
          {request.gymId && (
            <>
              {" "}
              (
              <Link href={`/super-admin/gyms/${request.gymId}`} className="font-semibold underline">
                open it
              </Link>
              )
            </>
          )}
          . Creating another makes a second gym, and the request will point at the new one.
        </Alert>
      )}
      {fromError && (
        <Alert tone="warning">
          The request this form was opened from could not be loaded ({fromError}), so nothing has been filled in. Fill the form in by hand, or open the
          request again from{" "}
          <Link href="/super-admin/demo-requests" className="font-semibold underline">
            Demo requests
          </Link>
          .
        </Alert>
      )}
      {requestPlanGone && (
        <Alert tone="warning">
          They chose {request!.plan!.name}, which is no longer on sale. Pick a plan for them below.
        </Alert>
      )}

      {error && <Alert tone="error" onDismiss={() => setError(null)}>{error}</Alert>}

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Panel
            title={
              <span className="flex items-center gap-2">
                <FiDatabase className="h-4 w-4 text-neutral-400" /> Gym
              </span>
            }
            description="The name is the only thing to decide. The web address and the database follow from it, and neither can be changed later."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field
                  label="Gym name"
                  hint={
                    suggestedSlug ? (
                      <>
                        Its web address will be <span className="font-mono">{suggestedSlug}</span>, and a number is added if that name is already
                        taken.
                      </>
                    ) : undefined
                  }
                >
                  <Input value={form.name} onChange={on("name")} required placeholder="Iron Works Fitness" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field
                  label="Database name"
                  hint={
                    <>
                      Its own database beside <span className="font-mono">{config?.platform_database || "the main database"}</span> on the same
                      cluster. Named after the gym with an id on the end, so no two gyms can ever share one.
                    </>
                  }
                >
                  <Input value={databaseName} placeholder="Named by the server when the gym is created" disabled readOnly className="font-mono" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field
                  label="Domains (one per line or comma separated)"
                  hint={
                    <>
                      The first is the primary. Each is added to the website host, with its www address; the owner still has to point its DNS there.
                      {config?.root_domain && suggestedSlug ? (
                        <>
                          {" "}
                          The gym also gets <span className="font-mono">{suggestedSlug}.{config.root_domain}</span>, which works straight away — the
                          owner&apos;s invite uses it.
                        </>
                      ) : null}
                    </>
                  }
                >
                  <Textarea value={form.domains} onChange={on("domains")} placeholder={"ironworks.com\nwww.ironworks.com"} className="font-mono" />
                </Field>
                {noWebAddress && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    This platform has no root domain (PLATFORM_ROOT_DOMAIN on the API), so a gym without a domain has no web address and cannot be
                    created. Add one — for local testing, <span className="font-mono">{suggestedSlug || "ironworks"}.localhost:3000</span> works.
                  </p>
                )}
              </div>
            </div>
          </Panel>

          <Panel
            title={
              <span className="flex items-center gap-2">
                <FiUser className="h-4 w-4 text-neutral-400" /> Owner account
              </span>
            }
            description="Created as an administrator inside the gym. The owner is emailed a link to choose their own password; the one typed here is only a fallback you can pass on by hand."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="First name">
                <Input value={form.ownerFirstName} onChange={on("ownerFirstName")} autoComplete="off" />
              </Field>
              <Field label="Last name">
                <Input value={form.ownerLastName} onChange={on("ownerLastName")} autoComplete="off" />
              </Field>
              <Field
                label="Email"
                hint={
                  emailLocked ? (
                    <>
                      From their signup.{" "}
                      <button type="button" onClick={() => setEmailLocked(false)} className="font-semibold text-indigo-600 hover:text-indigo-700">
                        Change it
                      </button>
                    </>
                  ) : undefined
                }
              >
                <Input
                  type="email"
                  value={form.ownerEmail}
                  onChange={on("ownerEmail")}
                  required
                  disabled={emailLocked}
                  readOnly={emailLocked}
                  autoComplete="off"
                />
              </Field>
              <Field label="Phone">
                <Input value={form.ownerPhone} onChange={on("ownerPhone")} autoComplete="off" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Password (min 8 characters)">
                  <Input type="password" value={form.ownerPassword} onChange={on("ownerPassword")} required autoComplete="new-password" />
                </Field>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title={
              <span className="flex items-center gap-2">
                <FiGlobe className="h-4 w-4 text-neutral-400" /> Plan &amp; locale
              </span>
            }
          >
            <div className="space-y-4">
              <Field
                label="Platform plan"
                hint={
                  selectedPlan
                    ? `Starts on a ${selectedPlan.trialDays}-day trial, then ${selectedPlan.price.currency} ${
                        billingCycle === "yearly" ? selectedPlan.price.yearly : selectedPlan.price.monthly
                      }/${billingCycle === "yearly" ? "year" : "month"}.`
                    : "For a gym you host without charging: no limits, no renewal date, nothing to bill. Pick a plan to put it on the price list."
                }
              >
                <Select value={form.planId} onChange={(e) => choosePlan(e.target.value)}>
                  <option value="">No plan (unlimited, no billing)</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.price.currency} {p.price.monthly}/mo
                    </option>
                  ))}
                </Select>
              </Field>
              {addonNote && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{addonNote}</p>}

              {form.planId && (
                <>
                  <Field label="Billing cycle">
                    <Select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as "monthly" | "yearly")}>
                      <option value="monthly">Monthly</option>
                      {/* A plan with no yearly price would be sold for nothing a year. */}
                      <option value="yearly" disabled={!selectedPlan || selectedPlan.price.yearly <= 0}>
                        Yearly
                      </option>
                    </Select>
                  </Field>

                  {sellableAddons.length > 0 && (
                    <Field label="Add-ons" hint="Charged on top of the plan. Included ones are added by the plan itself.">
                      <div className="flex flex-wrap gap-2 pt-1">
                        {sellableAddons.map((addon) => {
                          const on = addonSlugs.includes(addon.slug);
                          const price = billingCycle === "yearly" ? addon.price.yearly : addon.price.monthly;
                          return (
                            <button
                              key={addon.slug}
                              type="button"
                              onClick={() => setAddonSlugs((list) => (on ? list.filter((s) => s !== addon.slug) : [...list, addon.slug]))}
                              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                                on ? "border-indigo-600 bg-indigo-600 text-white" : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                              }`}
                            >
                              {addon.name} +{addon.price.currency} {price}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  )}
                </>
              )}
              <Field label="Timezone" hint="Pick one from the list, such as Asia/Karachi. Attendance, timetables and reminders run on this clock.">
                <Input list="tz-list" value={form.timezone} onChange={on("timezone")} />
                <datalist id="tz-list">
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz} />
                  ))}
                </datalist>
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Currency" hint="What it charges its members in.">
                  <Input value={form.currency} onChange={(e) => set("currency")(e.target.value.toUpperCase())} placeholder={DEFAULT_CURRENCY} maxLength={3} />
                </Field>
                <Field label="Country">
                  <Input value={form.country} onChange={on("country")} placeholder="PK" />
                </Field>
              </div>
            </div>
          </Panel>

          <Panel title="Internal notes">
            <Textarea value={form.notes} onChange={on("notes")} placeholder="Contract details, contacts…" />
          </Panel>

          <div className="flex flex-col gap-2">
            <Button type="submit" loading={busy}>
              {busy ? "Creating…" : "Create gym"}
            </Button>
            <Button variant="secondary" onClick={() => router.push("/super-admin/gyms")} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

export default function NewGymPage() {
  // The form reads ?from= to fill itself in from a request, and
  // useSearchParams needs a boundary around it.
  return (
    <Suspense fallback={null}>
      <NewGymForm />
    </Suspense>
  );
}

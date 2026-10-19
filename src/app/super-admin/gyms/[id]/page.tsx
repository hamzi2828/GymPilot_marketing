"use client";

// One gym: what it is, what it is on, whether it is being served, and the
// numbers from inside its own database.

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FiAlertTriangle, FiCalendar, FiCopy, FiCreditCard, FiExternalLink, FiGlobe, FiLayers, FiMail, FiShield, FiUsers } from "react-icons/fi";
import { PageHeader, Crumbs, Panel, StatCard, KeyValue, Button, Field, Input, Select, Textarea, Modal, Spinner, Alert, Pill, StatusPill, Avatar, useAsyncAction } from "../../_shared/ui";
import { PaymentsPanel } from "./Payments";
import { platformFetch, PlatformApiError, formatDate, formatMoney, addonsSoldWith, keepAddonsFor, DEFAULT_CURRENCY, SUBSCRIPTION_STATUSES, BILLING_CYCLES, type Addon, type DomainStatus, type Gym, type GymStats, type Plan } from "../../_shared/api";

type Detail = Gym & { plan: Plan | null; stats: GymStats };
type Admin = { id: string; name: string; email: string; is_active: boolean; last_login: string | null };
type HostResult = { host: string; added: boolean; verified?: boolean; error?: string; skipped?: string; verification?: { type: string; domain: string; value: string }[]; dns?: { type: string; name: string; value: string; note: string } };
type Hosting = {
  connected: boolean;
  // A root domain comes back with its www twin, which the website host
  // needs as a name of its own.
  added: (HostResult & { dns: { type: string; name: string; value: string; note: string }; www?: HostResult })[];
};
type InviteResult = {
  data: {
    created: boolean;
    email: string;
    passwordSet: boolean;
    inviteSent: boolean;
    /** Why the email did not go, when it did not. */
    inviteError?: string | null;
    /** The set-password link itself, when the API hands it over because the email did not go. */
    setPasswordLink?: string | null;
  };
  warnings?: string[];
};
/** What the last "Resend owner invite" or "Reset owner password" did, shown until dismissed. */
type InviteOutcome = { email: string; passwordSet: boolean; sent: boolean; reason: string; link: string };

/**
 * The answer to an owner invite: whether the email went, why not, and --
 * when the API gave it -- the set-password link to pass on by hand.
 */
function InviteOutcomeNotice({ outcome, onDismiss }: { outcome: InviteOutcome; onDismiss: () => void }) {
  const [copied, setCopied] = useState<"yes" | "failed" | null>(null);
  const copy = () => {
    if (!navigator.clipboard) return setCopied("failed");
    navigator.clipboard.writeText(outcome.link).then(
      () => setCopied("yes"),
      () => setCopied("failed")
    );
  };
  return (
    <div className="px-5 pt-4">
      {outcome.passwordSet && (
        <Alert tone="success" onDismiss={outcome.sent ? onDismiss : undefined}>
          Password set for <span className="font-semibold">{outcome.email}</span>. They can sign in with it now.
          {outcome.sent ? " A set-password link was emailed to them as well." : ""}
        </Alert>
      )}
      {!outcome.passwordSet && outcome.sent && (
        <Alert tone="success" onDismiss={onDismiss}>
          A set-password link was emailed to <span className="font-semibold">{outcome.email}</span>.
        </Alert>
      )}
      {!outcome.sent && (
        <Alert tone="warning" onDismiss={onDismiss}>
          <span className="block">
            The set-password email to <span className="font-semibold">{outcome.email}</span> could not be sent{outcome.reason ? `: ${outcome.reason}` : "."}
          </span>
          {outcome.link ? (
            <span className="mt-2 block">
              Send the owner this link yourself, by WhatsApp for example. It opens the page where they choose their password.
              <span className="mt-2 flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 break-all rounded-lg bg-white px-2 py-1.5 font-mono text-xs text-neutral-900 ring-1 ring-amber-200">{outcome.link}</span>
                <Button variant="secondary" size="sm" onClick={copy}>
                  <FiCopy className="h-3.5 w-3.5" /> {copied === "yes" ? "Copied" : "Copy"}
                </Button>
              </span>
              {copied === "failed" && <span className="mt-1 block text-xs">Could not copy: select the link and copy it by hand.</span>}
            </span>
          ) : (
            <span className="mt-1 block">
              {outcome.passwordSet ? "Pass the password on to them yourself." : <>Use &quot;Reset owner password&quot; to set a password by hand and pass it on.</>}
            </span>
          )}
        </Alert>
      )}
    </div>
  );
}

/** A plan's price for a cycle, as the amount field shows it. */
function planPrice(plan: Plan | undefined, cycle: string): string {
  if (!plan) return "";
  return String(cycle === "yearly" ? plan.price.yearly : plan.price.monthly);
}

function GymDetail() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const id = params.id;
  // Set by the New gym form right after creating this gym: did the owner's
  // invite go, and what else did not go to plan.
  const inviteParam = search.get("invite");
  // The site the set-password link opens on -- the platform subdomain when
  // the gym has one, not necessarily its primary domain.
  const inviteHost = search.get("inviteHost");
  const creationWarnings = search.getAll("warning");

  const [gym, setGym] = useState<Detail | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // What the website host said when domains were saved: added to Vercel,
  // or the DNS record the owner has to create.
  const [hosting, setHosting] = useState<Hosting | null>(null);
  // Where each registered domain stands on the website host right now.
  const [domainStatus, setDomainStatus] = useState<{ connected: boolean; data: DomainStatus[] } | null>(null);
  // One change to the gym at a time: the button that started it spins, the others wait.
  const action = useAsyncAction();
  const busy = action.busy;

  // Editors
  const [details, setDetails] = useState({ name: "", ownerFirstName: "", ownerLastName: "", ownerEmail: "", ownerPhone: "", timezone: "", currency: "", country: "", notes: "" });
  const [domainsText, setDomainsText] = useState("");
  const [sub, setSub] = useState({ planId: "", status: "trialing", billingCycle: "monthly", amount: "", currency: "", currentPeriodEnd: "", notes: "" });
  const [addons, setAddons] = useState<Addon[]>([]);
  const [addonSlugs, setAddonSlugs] = useState<string[]>([]);
  // Which add-ons the last change of plan took off, if any.
  const [addonNote, setAddonNote] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [reset, setReset] = useState({ email: "", password: "" });
  // A refused reset is said inside its window, which stays open.
  const [resetError, setResetError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteOutcome | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState("");
  const [dropDatabase, setDropDatabase] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Stripe would not cancel the gym's card subscription, so nothing was
  // deleted; the admin may say they have cancelled it by hand.
  const [stripeRefused, setStripeRefused] = useState(false);
  const [cancelledByHand, setCancelledByHand] = useState(false);
  // Members who pay the gym by card keep being charged after it is gone;
  // the admin has to say they know. `membersRefused`: the API found some
  // this page had not counted yet.
  const [membersRefused, setMembersRefused] = useState(false);
  const [membersAcknowledged, setMembersAcknowledged] = useState(false);
  const closeDelete = useCallback(() => {
    setDeleteOpen(false);
    setDeleteError(null);
    setStripeRefused(false);
    setCancelledByHand(false);
    setMembersRefused(false);
    setMembersAcknowledged(false);
  }, []);

  const hydrate = useCallback((g: Detail) => {
    setGym(g);
    setDetails({
      name: g.name,
      ownerFirstName: g.owner.firstName || "",
      ownerLastName: g.owner.lastName || "",
      ownerEmail: g.owner.email || "",
      ownerPhone: g.owner.phone || "",
      timezone: g.locale.timezone || "UTC",
      currency: g.locale.currency || DEFAULT_CURRENCY,
      country: g.locale.country || "",
      notes: g.notes || "",
    });
    setDomainsText(g.domains.map((d) => d.host).join("\n"));
    setSub({
      planId: g.plan ? g.plan.id || g.plan._id || "" : "",
      status: g.subscription.status,
      billingCycle: g.subscription.billingCycle,
      amount: String(g.subscription.planAmount ?? g.subscription.amount ?? ""),
      currency: g.subscription.currency || DEFAULT_CURRENCY,
      currentPeriodEnd: g.subscription.currentPeriodEnd ? String(g.subscription.currentPeriodEnd).slice(0, 10) : "",
      notes: g.subscription.notes || "",
    });
    setAddonSlugs((g.subscription.addons || []).map((a) => a.slug));
    setAddonNote(null);
    setReset((r) => ({ ...r, email: g.owner.email || "" }));
  }, []);

  const load = useCallback(async () => {
    try {
      const [detail, planList, addonList] = await Promise.all([
        platformFetch<{ data: Detail }>(`/gyms/${id}`),
        platformFetch<{ data: Plan[] }>("/plans"),
        platformFetch<{ data: Addon[] }>("/addons"),
      ]);
      hydrate(detail.data);
      setPlans(planList.data);
      setAddons(addonList.data);
      setError(null);
      // Best effort: the page is complete without it.
      platformFetch<{ connected: boolean; data: DomainStatus[] }>(`/gyms/${id}/domains/status`)
        .then((res) => setDomainStatus({ connected: res.connected, data: res.data }))
        .catch(() => setDomainStatus(null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this gym");
    }
  }, [id, hydrate]);

  useEffect(() => {
    load();
  }, [load]);

  // What this plan comes with for nothing, and what can be sold on top of it
  // -- in the plan's currency only; the API refuses the rest.
  const chosenPlan = plans.find((p) => p.id === sub.planId);
  const includedSlugs = chosenPlan?.includedAddons || [];
  const includedAddons = addons.filter((addon) => addon.isActive && includedSlugs.includes(addon.slug));
  const sellableAddons = addonsSoldWith(chosenPlan, addons);

  // Picking a plan (or a cycle) resets the amount to that plan's price for
  // the cycle, so a price typed for the old plan is never sent for the new.
  // The add-ons the new plan does not sell come off, and the admin is told
  // which: still ticked out of sight, they had the save refused.
  const choosePlan = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    setSub((x) => {
      // A plan with no yearly price is sold monthly only.
      const billingCycle = plan && plan.price.yearly <= 0 ? "monthly" : x.billingCycle;
      return { ...x, planId, billingCycle, amount: planPrice(plan, billingCycle), currency: plan ? plan.price.currency : x.currency };
    });
    const kept = keepAddonsFor(plan, addons, addonSlugs);
    setAddonSlugs(kept.slugs);
    setAddonNote(kept.message);
  };
  const chooseCycle = (billingCycle: string) =>
    setSub((x) => {
      const plan = plans.find((p) => p.id === x.planId);
      return { ...x, billingCycle, amount: plan ? planPrice(plan, billingCycle) : x.amount };
    });

  // "Resend owner invite": a set-password link, nothing about the password
  // itself changes; "Reset owner password" may set one by hand as well. The
  // answer says whether the email went, and why not. Run through `action` by
  // the button that asks for it. Resolves to why it was refused, or null.
  const sendInvite = async (email: string, password?: string): Promise<string | null> => {
    setError(null);
    setNotice(null);
    setInvite(null);
    try {
      const res = await platformFetch<InviteResult>(`/gyms/${id}/reset-owner-password`, { method: "POST", body: password ? { email, password } : { email } });
      // Reloaded before the answer is shown: a reload clears the page's
      // messages, and this one has to stay in front of the admin.
      await load();
      setInvite({
        email: res.data.email,
        passwordSet: res.data.passwordSet,
        sent: res.data.inviteSent,
        reason: res.data.inviteSent ? "" : res.data.inviteError || "",
        link: res.data.inviteSent ? "" : res.data.setPasswordLink || "",
      });
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Request failed";
    }
  };
  const chosenAddons = sellableAddons.filter((addon) => addonSlugs.includes(addon.slug));
  const priceOf = (addon: Addon) => (sub.billingCycle === "yearly" ? addon.price.yearly : addon.price.monthly);
  const planShare = Number(sub.amount) || 0;
  const billTotal = chosenAddons.reduce((total, addon) => total + priceOf(addon), planShare);

  useEffect(() => {
    platformFetch<{ data: Admin[] }>(`/gyms/${id}/admins`)
      .then((res) => setAdmins(res.data))
      .catch(() => setAdmins([]));
  }, [id, gym?.updatedAt]);

  // `key` says which button spins while it runs.
  const run = (key: string, label: string, fn: () => Promise<unknown>) =>
    action.run(key, async () => {
      setError(null);
      setNotice(null);
      try {
        await fn();
        await load();
        setNotice(label);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed");
      }
    });

  if (error && !gym) return <Alert tone="error">{error}</Alert>;
  if (!gym) return <Spinner />;

  const paysByCard = !!gym.subscription.stripeSubscriptionId;
  // Suspending and reactivating. The API pauses the gym's card subscription
  // in Stripe with it; when Stripe refuses, the switch still happens and the
  // warning says what is left to do by hand.
  const setGymStatus = (status: "active" | "suspended") =>
    action.run("status", async () => {
      setError(null);
      setNotice(null);
      try {
        const res = await platformFetch<{ warnings?: string[] }>(`/gyms/${id}/status`, { method: "PATCH", body: { status } });
        await load();
        if (res.warnings?.length) setError(res.warnings.join(" "));
        else if (status === "suspended") setNotice(paysByCard ? "Gym suspended. Its card is not charged while it is suspended." : "Gym suspended.");
        else setNotice(paysByCard ? "Gym reactivated. Its card is charged again from its next billing date." : "Gym reactivated.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed");
      } finally {
        setSuspendOpen(false);
      }
    });

  const stats = gym.stats || {};
  const cardSubscriptions = stats.card_subscriptions || 0;
  const membersStillPaying = cardSubscriptions > 0 || membersRefused;
  // Primary domain, else the platform subdomain, else the API's fallback --
  // computed by the API so it matches the links in the gym's emails.
  const siteUrl = gym.siteUrl || (gym.domains[0]?.host ? `https://${gym.domains[0].host}` : "");
  const siteHost = siteUrl.replace(/^https?:\/\//, "");
  const d = (key: keyof typeof details) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDetails((x) => ({ ...x, [key]: e.target.value }));
  const s = (key: keyof typeof sub) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSub((x) => ({ ...x, [key]: e.target.value }));

  return (
    <>
      <PageHeader
        eyebrow={<Crumbs items={[{ label: "Gyms", href: "/super-admin/gyms" }, { label: gym.name }]} />}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Avatar name={gym.name} size="lg" />
            {gym.name}
            <StatusPill status={gym.subscription.status} />
            {gym.status === "suspended" && <Pill tone="suspended">suspended</Pill>}
          </span>
        }
        description={
          <span className="font-mono text-xs">
            {gym.slug} · {gym.database.name}
          </span>
        }
        actions={
          <>
            {siteUrl && (
              <Button variant="secondary" href={siteUrl}>
                <FiExternalLink className="h-4 w-4" /> Open website
              </Button>
            )}
            {gym.status === "suspended" ? (
              <Button disabled={busy} loading={action.pending === "status"} onClick={() => setGymStatus("active")}>
                Reactivate
              </Button>
            ) : (
              <Button variant="danger" disabled={busy} onClick={() => setSuspendOpen(true)}>
                Suspend
              </Button>
            )}
          </>
        }
      />

      {gym.access_block && (
        <Alert tone="warning">
          <span className="flex items-center gap-2">
            <FiAlertTriangle className="h-4 w-4" /> Not being served: {gym.access_block.message}
          </span>
        </Alert>
      )}
      {inviteParam === "sent" && (
        <Alert tone="success">
          <span className="flex items-center gap-2">
            <FiMail className="h-4 w-4" /> The owner has been emailed a link to set their password at <span className="font-mono">{inviteHost || siteHost}/authentication</span>.
          </span>
        </Alert>
      )}
      {inviteParam === "failed" && (
        <Alert tone="warning">
          <span className="flex items-center gap-2">
            <FiAlertTriangle className="h-4 w-4" /> The owner&apos;s invite email could not be sent. Check the API&apos;s SMTP settings, then use &quot;Resend owner invite&quot; below.
          </span>
        </Alert>
      )}
      {creationWarnings
        .filter((w) => w !== "Owner email could not be sent")
        .map((w) => (
          <Alert key={w} tone="warning">
            {w}
          </Alert>
        ))}
      {error && <Alert tone="error" onDismiss={() => setError(null)}>{error}</Alert>}
      {notice && <Alert tone="success" onDismiss={() => setNotice(null)}>{notice}</Alert>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Members" value={stats.error ? "—" : stats.members ?? "—"} tone="accent" icon={<FiUsers className="h-4 w-4" />} />
        <StatCard label="Active memberships" value={stats.error ? "—" : stats.active_memberships ?? "—"} tone="good" icon={<FiCreditCard className="h-4 w-4" />} />
        <StatCard label="Staff" value={stats.error ? "—" : stats.staff ?? "—"} />
        <StatCard label="Trainers" value={stats.error ? "—" : stats.trainers ?? "—"} />
        <StatCard label="Classes" value={stats.error ? "—" : stats.classes ?? "—"} icon={<FiCalendar className="h-4 w-4" />} />
        <StatCard label="Revenue this month" value={stats.revenue_this_month && stats.revenue_this_month.length ? stats.revenue_this_month.map((r) => formatMoney(r.total, r.currency)).join(" · ") : "—"} hint={stats.pending_orders ? `${stats.pending_orders} pending orders` : undefined} />
      </div>
      {stats.error && <p className="mt-2 text-xs text-rose-600">Could not read the gym&apos;s database: {stats.error}</p>}

      {/* Wide screens: the gym and its owner, its plan, and who runs it with
          its domains, side by side; narrower, two columns and then one. */}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2 min-[1400px]:grid-cols-3">
        {/* Identity */}
        <Panel
          title="Gym & owner"
          footer={
            <>
              <span className="text-xs text-neutral-500">Created {formatDate(gym.createdAt)} · last login inside the gym {formatDate(stats.last_login_at)}</span>
              <Button
                disabled={busy}
                loading={action.pending === "details"}
                onClick={() =>
                  run("details", "Details saved", () =>
                    platformFetch(`/gyms/${id}`, {
                      method: "PUT",
                      body: {
                        name: details.name,
                        owner: { firstName: details.ownerFirstName, lastName: details.ownerLastName, email: details.ownerEmail, phone: details.ownerPhone },
                        locale: { timezone: details.timezone, currency: details.currency, country: details.country },
                        notes: details.notes,
                      },
                    })
                  )
                }
              >
                Save details
              </Button>
            </>
          }
        >
          <KeyValue
            columns="grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 min-[1800px]:grid-cols-4"
            items={[
              { label: "Slug", value: <span className="font-mono">{gym.slug}</span> },
              { label: "Database", value: <span className="font-mono">{gym.database.name}</span> },
              { label: "Provisioned", value: formatDate(gym.provisionedAt) },
              { label: "Last visit", value: formatDate(stats.last_visit_at) },
            ]}
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Gym name">
              <Input value={details.name} onChange={d("name")} />
            </Field>
            <Field label="Owner email">
              <Input type="email" value={details.ownerEmail} onChange={d("ownerEmail")} />
            </Field>
            <Field label="Owner first name">
              <Input value={details.ownerFirstName} onChange={d("ownerFirstName")} />
            </Field>
            <Field label="Owner last name">
              <Input value={details.ownerLastName} onChange={d("ownerLastName")} />
            </Field>
            <Field label="Owner phone">
              <Input value={details.ownerPhone} onChange={d("ownerPhone")} />
            </Field>
            <Field label="Timezone (IANA)">
              <Input value={details.timezone} onChange={d("timezone")} />
            </Field>
            <Field label="Currency">
              <Input value={details.currency} onChange={(e) => setDetails((x) => ({ ...x, currency: e.target.value.toUpperCase() }))} maxLength={3} />
            </Field>
            <Field label="Country">
              <Input value={details.country} onChange={d("country")} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Internal notes">
                <Textarea value={details.notes} onChange={d("notes")} />
              </Field>
            </div>
          </div>
        </Panel>

        {/* Subscription */}
        {/* What the gym will pay once this is saved: the plan, plus whatever
            add-ons are ticked. The server works out the same total. */}
        <Panel
          title={
            <span className="flex items-center gap-2">
              <FiLayers className="h-4 w-4 text-neutral-400" /> Plan &amp; subscription
            </span>
          }
          description={
            gym.subscription.stripeSubscriptionId
              ? "This gym pays by card through Stripe: a new plan, cycle, price or add-on is changed on its Stripe subscription first (prorated), and saved here only once Stripe accepts it."
              : "This gym is billed by hand. Each time it pays, use Record payment below: that moves the period end on for you. When the period end passes the gym goes past due, and after the grace period it stops being served."
          }
          footer={
            <>
              <span className="text-xs text-neutral-500">
                Currently {gym.subscription.status.replace("_", " ")}
                {gym.subscription.currentPeriodEnd ? ` until ${formatDate(gym.subscription.currentPeriodEnd)}` : ""} · {formatMoney(gym.subscription.amount, gym.subscription.currency)} / {gym.subscription.billingCycle}
                {(gym.subscription.addons || []).length > 0 && (
                  <> · {formatMoney(gym.subscription.planAmount ?? 0, gym.subscription.currency)} plan + {(gym.subscription.addons || []).map((a) => a.name).join(", ")}</>
                )}
                {gym.subscription.stripeSubscriptionId && (
                  <span className="block">
                    Paid by card through Stripe{gym.subscription.stripePriceSummary ? ` · ${gym.subscription.stripePriceSummary}` : ""} · <span className="font-mono">{gym.subscription.stripeSubscriptionId}</span>
                  </span>
                )}
              </span>
              <Button
                disabled={busy}
                loading={action.pending === "subscription"}
                onClick={() =>
                  // A card-paying gym's price change goes to Stripe first; if
                  // Stripe refuses, the error says why and nothing is saved.
                  run("subscription", gym.subscription.stripeSubscriptionId ? "Subscription saved (and Stripe updated where the price changed)" : "Subscription saved", () =>
                    platformFetch(`/gyms/${id}/subscription`, {
                      method: "PUT",
                      body: {
                        planId: sub.planId,
                        status: sub.status,
                        billingCycle: sub.billingCycle,
                        amount: sub.amount === "" ? undefined : Number(sub.amount),
                        addonSlugs,
                        currency: sub.currency,
                        currentPeriodEnd: sub.currentPeriodEnd || null,
                        notes: sub.notes,
                      },
                    })
                  )
                }
              >
                Save subscription
              </Button>
            </>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Plan">
              <Select value={sub.planId} onChange={(e) => choosePlan(e.target.value)}>
                <option value="">No plan (unlimited)</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.price.currency} {p.price.monthly}/mo
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={sub.status} onChange={s("status")}>
                {SUBSCRIPTION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Billing cycle">
              <Select value={sub.billingCycle} onChange={(e) => chooseCycle(e.target.value)}>
                {BILLING_CYCLES.map((c) => (
                  // A plan with no yearly price would be sold for nothing a year.
                  <option key={c} value={c} disabled={c === "yearly" && !!chosenPlan && chosenPlan.price.yearly <= 0}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Period ends">
              <Input type="date" value={sub.currentPeriodEnd} onChange={s("currentPeriodEnd")} />
            </Field>
            <Field label="Plan price per cycle" hint="Leave as the plan's own price unless this gym agreed something else.">
              <Input type="number" value={sub.amount} onChange={s("amount")} />
            </Field>
            <Field label="Currency">
              <Input value={sub.currency} onChange={(e) => setSub((x) => ({ ...x, currency: e.target.value.toUpperCase() }))} maxLength={3} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Add-ons" hint="Charged on top of the plan. Manage the list and its prices under Plans.">
                <div className="flex flex-wrap gap-2 pt-1">
                  {includedAddons.map((addon) => (
                    <span
                      key={addon.slug}
                      title={`${chosenPlan?.name || "This plan"} comes with it`}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-sm font-medium text-emerald-700"
                    >
                      {addon.name} · included
                    </span>
                  ))}
                  {sellableAddons.map((addon) => {
                    const on = addonSlugs.includes(addon.slug);
                    return (
                      <button
                        key={addon.slug}
                        type="button"
                        onClick={() => setAddonSlugs((list) => (on ? list.filter((sl) => sl !== addon.slug) : [...list, addon.slug]))}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                          on ? "border-indigo-600 bg-indigo-600 text-white" : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                        }`}
                      >
                        {addon.name} +{formatMoney(priceOf(addon), addon.price.currency)}
                      </button>
                    );
                  })}
                  {includedAddons.length === 0 && sellableAddons.length === 0 && (
                    <p className="text-sm text-neutral-500">Nothing is sold with this plan.</p>
                  )}
                </div>
              </Field>
              {addonNote && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{addonNote}</p>}
            </div>

            <div className="md:col-span-2 rounded-xl bg-neutral-50 px-4 py-3 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Plan</span>
                <span className="font-medium text-neutral-900">{formatMoney(planShare, sub.currency || DEFAULT_CURRENCY)}</span>
              </div>
              {includedAddons.map((addon) => (
                <div key={addon.slug} className="mt-1 flex justify-between text-neutral-600">
                  <span>{addon.name}</span>
                  <span className="font-medium text-emerald-700">included</span>
                </div>
              ))}
              {chosenAddons.map((addon) => (
                <div key={addon.slug} className="mt-1 flex justify-between text-neutral-600">
                  <span>{addon.name}</span>
                  <span className="font-medium text-neutral-900">+{formatMoney(priceOf(addon), addon.price.currency)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2 font-semibold text-neutral-900">
                <span>Total per {sub.billingCycle === "yearly" ? "year" : "month"}</span>
                <span>{formatMoney(billTotal, sub.currency || "PKR")}</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <Field label="Billing notes">
                <Textarea value={sub.notes} onChange={s("notes")} />
              </Field>
            </div>
          </div>
        </Panel>

        <div className="grid items-start gap-6 lg:col-span-2 lg:grid-cols-2 min-[1400px]:col-span-1 min-[1400px]:grid-cols-1">
          {/* Administrators */}
          <Panel
            title={
              <span className="flex items-center gap-2">
                <FiShield className="h-4 w-4 text-neutral-400" /> Administrators inside the gym
              </span>
            }
            actions={
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy || !gym.owner.email}
                  loading={action.pending === "invite"}
                  onClick={() =>
                    action.run("invite", async () => {
                      const problem = await sendInvite(gym.owner.email);
                      if (problem) setError(problem);
                    })
                  }
                >
                  <FiMail className="h-3.5 w-3.5" /> Resend owner invite
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setResetError(null);
                    setResetOpen(true);
                  }}
                >
                  Reset owner password
                </Button>
              </>
            }
            footer={
              <span className="text-xs text-neutral-500">
                The owner signs in at <span className="font-mono">{siteHost ? `${siteHost}/authentication` : "<domain>/authentication"}</span> and manages the gym at <span className="font-mono">/admin</span>. &quot;Resend owner invite&quot; emails {gym.owner.email || "the owner"} a link to set their password.
              </span>
            }
            padded={false}
          >
            {invite && <InviteOutcomeNotice key={`${invite.email}-${invite.link}`} outcome={invite} onDismiss={() => setInvite(null)} />}
            {admins === null ? (
              <p className="px-5 py-5 text-xs text-neutral-500">Loading…</p>
            ) : !admins.length ? (
              <p className="px-5 py-5 text-xs text-neutral-500">No administrator account yet. Use &quot;Reset owner password&quot; to create one.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {admins.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                    <Avatar name={a.name || a.email} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-neutral-900">{a.name || a.email}</p>
                      <p className="truncate text-xs text-neutral-500">{a.email}</p>
                    </div>
                    <div className="text-right text-xs text-neutral-500">
                      {a.is_active ? <Pill tone="good">active</Pill> : <Pill tone="bad">disabled</Pill>}
                      <p className="mt-1">last login {formatDate(a.last_login)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Domains */}
          <Panel
            title={
              <span className="flex items-center gap-2">
                <FiGlobe className="h-4 w-4 text-neutral-400" /> Domains
              </span>
            }
            description="Every domain that should show this gym's website. The first line is the primary, used in emails and redirects."
            footer={
              <>
                <div className="flex flex-wrap gap-1.5">
                  {gym.domains.map((dom) => (
                    <Pill key={dom.host} tone={dom.isPrimary ? "primary" : "neutral"} dot={false}>
                      <span className="font-mono normal-case">{dom.host}</span>
                      {dom.isPrimary ? " · primary" : ""}
                    </Pill>
                  ))}
                  {!gym.domains.length && <span className="text-xs text-neutral-500">No domain yet</span>}
                </div>
                <Button
                  disabled={busy}
                  loading={action.pending === "domains"}
                  onClick={() =>
                    run("domains", "Domains saved", async () => {
                      const res = await platformFetch<{ hosting?: Hosting }>(`/gyms/${id}/domains`, {
                        method: "PUT",
                        body: {
                          domains: domainsText
                            .split(/[\s,]+/)
                            .map((h) => h.trim())
                            .filter(Boolean)
                            .map((host, i) => ({ host, isPrimary: i === 0 })),
                        },
                      });
                      setHosting(res.hosting || null);
                    })
                  }
                >
                  Save domains
                </Button>
              </>
            }
          >
            <Field label="One domain per line">
              <Textarea value={domainsText} onChange={(e) => setDomainsText(e.target.value)} placeholder={"ironworks.com\nwww.ironworks.com"} className="font-mono" />
            </Field>
            {hosting && hosting.added.length > 0 && (
              <div className="mt-4 space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-700">
                {hosting.added.map((h) => (
                  <div key={h.host}>
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-neutral-900">
                      <span className="font-mono">{h.host}</span>
                      <Pill tone={h.added ? (h.verified === false ? "warn" : "good") : h.skipped ? "neutral" : "bad"} dot={false}>
                        {h.added ? (h.verified === false ? "awaiting verification" : "added to the website host") : h.skipped ? "not added automatically" : `could not be added`}
                      </Pill>
                      {h.error && <span className="text-rose-600">{h.error}</span>}
                    </p>
                    <p className="mt-1.5">
                      DNS: add a <span className="rounded bg-white px-1 font-mono ring-1 ring-neutral-200">{h.dns.type}</span> record for <span className="rounded bg-white px-1 font-mono ring-1 ring-neutral-200">{h.dns.name}</span> pointing to <span className="rounded bg-white px-1 font-mono ring-1 ring-neutral-200">{h.dns.value}</span>. {h.dns.note}
                    </p>
                    {(h.verification || []).map((v, i) => (
                      <p key={i} className="mt-1">
                        Verification: <span className="font-mono">{v.type}</span> record <span className="font-mono">{v.domain}</span> = <span className="break-all font-mono">{v.value}</span>
                      </p>
                    ))}
                    {h.www && (
                      <div className="mt-1.5">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="font-mono">{h.www.host}</span>
                          <Pill tone={h.www.added ? (h.www.verified === false ? "warn" : "good") : "bad"} dot={false}>
                            {h.www.added ? (h.www.verified === false ? "awaiting verification" : "added to the website host") : "could not be added"}
                          </Pill>
                          {h.www.error && <span className="text-rose-600">{h.www.error}</span>}
                        </p>
                        {h.www.dns && (
                          <p className="mt-1">
                            DNS: add a <span className="rounded bg-white px-1 font-mono ring-1 ring-neutral-200">{h.www.dns.type}</span> record for <span className="rounded bg-white px-1 font-mono ring-1 ring-neutral-200">{h.www.dns.name}</span> pointing to <span className="rounded bg-white px-1 font-mono ring-1 ring-neutral-200">{h.www.dns.value}</span>.
                          </p>
                        )}
                        {(h.www.verification || []).map((v, i) => (
                          <p key={i} className="mt-1">
                            Verification: <span className="font-mono">{v.type}</span> record <span className="font-mono">{v.domain}</span> = <span className="break-all font-mono">{v.value}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {!hosting.connected && <p className="text-neutral-500">Connect Vercel on the API (VERCEL_TOKEN, VERCEL_PROJECT_ID) to add domains to the website project automatically.</p>}
              </div>
            )}

            {/* Where each domain stands on the website host: is DNS pointing
                here yet, and what to add if not. */}
            {domainStatus && domainStatus.data.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">DNS &amp; verification</p>
                <ul className="mt-2 divide-y divide-neutral-100 rounded-xl border border-neutral-200 text-xs">
                  {domainStatus.data.map((st) => {
                    const tone = !domainStatus.connected ? "neutral" : st.error ? "bad" : !st.on_project ? "warn" : st.misconfigured ? "warn" : st.verified === false ? "warn" : "good";
                    const label = !domainStatus.connected
                      ? "not checked"
                      : st.error
                      ? "could not check"
                      : !st.on_project
                      ? "not on the website host"
                      : st.verified === false
                      ? "awaiting verification"
                      : st.misconfigured
                      ? "DNS not pointing here"
                      : "live";
                    return (
                      <li key={st.host} className="px-3 py-2.5">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-neutral-900">{st.host}</span>
                          <Pill tone={tone} dot={false}>
                            {label}
                          </Pill>
                          {st.error && <span className="text-rose-600">{st.error}</span>}
                        </p>
                        {domainStatus.connected && label !== "live" && (
                          <p className="mt-1 text-neutral-600">
                            Add a <span className="rounded bg-white px-1 font-mono ring-1 ring-neutral-200">{st.dns.type}</span> record for <span className="rounded bg-white px-1 font-mono ring-1 ring-neutral-200">{st.dns.name}</span> pointing to <span className="rounded bg-white px-1 font-mono ring-1 ring-neutral-200">{st.dns.value}</span>.
                          </p>
                        )}
                        {(st.verification || []).map((v, i) => (
                          <p key={i} className="mt-1 text-neutral-600">
                            Verification: <span className="font-mono">{v.type}</span> record <span className="font-mono">{v.domain}</span> = <span className="break-all font-mono">{v.value}</span>
                          </p>
                        ))}
                      </li>
                    );
                  })}
                </ul>
                {!domainStatus.connected && <p className="mt-2 text-xs text-neutral-500">Vercel is not connected on the API, so DNS cannot be checked from here.</p>}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Payments taken outside Stripe, and the form that records one: the
          whole width, so its table has room. */}
      <div className="mt-6">
        <PaymentsPanel
          gymId={id}
          gymName={gym.name}
          reloadKey={gym.updatedAt}
          onRecorded={async (message, warnings) => {
            await load();
            setNotice(message);
            setError(warnings.length ? warnings.join(" ") : null);
          }}
        />
      </div>

      {/* Danger zone */}
      <Panel
        tone="danger"
        className="mt-6"
        title="Danger zone"
        description="Removing the gym takes it off the platform. Its database is kept unless you choose to drop it, in which case every member, payment and attendance record is gone for good."
        actions={
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete this gym
          </Button>
        }
        padded={false}
      />

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset owner password" size="sm">
        <p className="text-xs text-neutral-500">
          Emails this administrator a link to set their own password (creating the account inside the gym if the address is new). Type a password only if you need to set one by hand as well; the password itself is never emailed.
        </p>
        <div className="mt-4 space-y-4">
          <Field label="Email">
            <Input type="email" value={reset.email} onChange={(e) => setReset((r) => ({ ...r, email: e.target.value }))} />
          </Field>
          <Field label="New password (optional, min 8 characters)">
            <Input type="password" value={reset.password} onChange={(e) => setReset((r) => ({ ...r, password: e.target.value }))} autoComplete="new-password" />
          </Field>
        </div>
        {resetError && (
          <div className="mt-4">
            <Alert tone="error">{resetError}</Alert>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={busy || !reset.email || (reset.password.length > 0 && reset.password.length < 8)}
            loading={action.pending === "reset"}
            onClick={() =>
              action.run("reset", async () => {
                setResetError(null);
                const problem = await sendInvite(reset.email, reset.password || undefined);
                // Refused: nothing changed, and the window stays open to say why.
                if (problem) {
                  setResetError(problem);
                  return;
                }
                // Done: what happened is shown under Administrators.
                setResetOpen(false);
                setReset((r) => ({ ...r, password: "" }));
              })
            }
          >
            {reset.password ? "Set password & email link" : "Email set-password link"}
          </Button>
        </div>
      </Modal>

      <Modal open={suspendOpen} onClose={() => setSuspendOpen(false)} title={`Suspend ${gym.name}?`} size="sm">
        <p className="text-sm text-neutral-700">
          Its website, admin and member app go offline straight away, for the owner, staff and members alike. Nothing is deleted, and you can switch it back on at any time.
        </p>
        <p className="mt-2 text-sm text-neutral-700">
          {paysByCard
            ? "Its card subscription is paused in Stripe, so the owner is not charged while the gym is suspended. Reactivating starts the charges again from its next billing date."
            : "This gym does not pay by card, so nothing changes in Stripe. Its paid-until date does not move: time spent suspended still counts."}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setSuspendOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={busy} loading={action.pending === "status"} onClick={() => setGymStatus("suspended")}>
            Suspend gym
          </Button>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={closeDelete} title={`Delete ${gym.name}`} size="sm">
        <p className="text-sm text-neutral-700">
          This takes {gym.name} off GymsPilotPro. Its website, admin and member app stop working straight away.
        </p>
        <p className="mt-2 text-sm text-neutral-700">
          {paysByCard
            ? "Its card subscription is cancelled in Stripe first, so the owner is not charged again. Nothing is refunded automatically."
            : "This gym does not pay by card, so there is no card subscription to cancel."}
        </p>
        {cardSubscriptions > 0 && (
          <div className="mt-4">
            <Alert tone="warning">
              {cardSubscriptions === 1 ? "1 member pays" : `${cardSubscriptions} members pay`} this gym by card on a subscription. Deleting the gym does not stop those charges. Ask the owner to cancel them first, in the gym&apos;s admin or its Stripe dashboard.
            </Alert>
          </div>
        )}
        {deleteError && (
          <div className="mt-4">
            <Alert tone="error">{deleteError}</Alert>
          </div>
        )}
        <div className="mt-4 space-y-4">
          <Field label={`Type ${gym.slug} to confirm`}>
            <Input value={confirmSlug} onChange={(e) => setConfirmSlug(e.target.value)} className="font-mono" />
          </Field>
          <label className="flex items-start gap-2 text-sm text-rose-700">
            <input type="checkbox" checked={dropDatabase} onChange={(e) => setDropDatabase(e.target.checked)} className="mt-0.5 h-4 w-4 accent-rose-600" />
            <span>
              Also drop the database <span className="font-mono text-xs">{gym.database.name}</span> and delete the gym&apos;s uploaded files: ID scans, documents, payment proofs (irreversible)
            </span>
          </label>
          {membersStillPaying && (
            <label className="flex items-start gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={membersAcknowledged} onChange={(e) => setMembersAcknowledged(e.target.checked)} className="mt-0.5 h-4 w-4 accent-rose-600" />
              <span>I understand members&apos; card subscriptions with this gym are not cancelled by deleting it</span>
            </label>
          )}
          {/* Offered only once Stripe has refused to cancel the subscription. */}
          {stripeRefused && (
            <label className="flex items-start gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={cancelledByHand} onChange={(e) => setCancelledByHand(e.target.checked)} className="mt-0.5 h-4 w-4 accent-rose-600" />
              <span>
                I have cancelled <span className="font-mono text-xs">{gym.subscription.stripeSubscriptionId}</span> in Stripe myself
              </span>
            </label>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={closeDelete}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={busy || confirmSlug !== gym.slug || (stripeRefused && !cancelledByHand) || (membersStillPaying && !membersAcknowledged)}
            loading={action.pending === "delete"}
            onClick={() =>
              action.run("delete", async (leave) => {
                setDeleteError(null);
                try {
                  await platformFetch(`/gyms/${id}`, { method: "DELETE", body: { confirmSlug, dropDatabase, subscriptionCancelled: stripeRefused && cancelledByHand, memberSubscriptionsAcknowledged: membersStillPaying && membersAcknowledged } });
                  // Gone: busy until the list of gyms has replaced this page.
                  leave();
                  router.replace("/super-admin/gyms");
                } catch (e) {
                  // Nothing was deleted. The reason stays in front of the admin,
                  // with the way on when it is Stripe that said no.
                  if (e instanceof PlatformApiError && e.code === "SUBSCRIPTION_NOT_CANCELLED") setStripeRefused(true);
                  if (e instanceof PlatformApiError && e.code === "MEMBER_SUBSCRIPTIONS_ACTIVE") setMembersRefused(true);
                  setDeleteError(e instanceof Error ? e.message : "Could not delete the gym");
                }
              })
            }
          >
            Delete gym
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default function GymDetailPage() {
  // The page reads ?invite= from the New gym form, and useSearchParams needs
  // a boundary around it.
  return (
    <Suspense fallback={<Spinner />}>
      <GymDetail />
    </Suspense>
  );
}

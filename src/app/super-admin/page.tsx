"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiAlertCircle, FiArrowRight, FiCheckSquare, FiChevronRight, FiClock, FiGrid, FiInbox, FiPlus, FiTrendingUp } from "react-icons/fi";
import { PageHeader, Panel, StatCard, SegmentBar, Spinner, Alert, Button, Pill, Avatar, ACCENT, cx } from "./_shared/ui";
import { platformFetch, formatMoney, formatDate, DEFAULT_CURRENCY, type Gym, type Overview } from "./_shared/api";
import GymsTable from "./gyms/GymsTable";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

type Overdue = "past_due" | "expired";
const OVERDUE: Record<Overdue, string> = { past_due: "Past due", expired: "Expired" };

export default function SuperAdminOverviewPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The overview's overdue list holds past-due and expired gyms together.
  // When there are both, the gym list says which each one is.
  const [overdue, setOverdue] = useState<Record<string, Overdue> | null>(null);

  useEffect(() => {
    platformFetch<{ data: Overview }>("/overview")
      .then((res) => setOverview(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load overview"));
  }, []);

  useEffect(() => {
    const subs = overview?.subscriptions;
    if (!overview?.attention?.past_due.length || !subs?.past_due || !subs.expired) return;
    let cancelled = false;
    const ask = (status: Overdue) =>
      platformFetch<{ data: Gym[] }>(`/gyms?status=active&subscription=${status}`).then((res) => res.data.map((g) => [g.id, status] as const));
    Promise.all([ask("past_due"), ask("expired")])
      .then((lists) => {
        if (!cancelled) setOverdue(Object.fromEntries(lists.flat()));
      })
      .catch(() => {
        /* the rows say "Overdue" without knowing which */
      });
    return () => {
      cancelled = true;
    };
  }, [overview]);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!overview) return <Spinner />;

  const subs = overview.subscriptions;
  // Only one kind on the platform: every overdue row is that kind.
  const overdueOf = (id: string): Overdue | null => (!subs.expired ? "past_due" : !subs.past_due ? "expired" : overdue?.[id] || null);
  const attention = overview.attention || { renewing: [], past_due: [], suspended: [] };
  const attentionCount = attention.renewing.length + attention.past_due.length + attention.suspended.length;
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <PageHeader
        eyebrow={today}
        title={`${greeting()}`}
        description="Every gym on the platform, how they are paying, and what needs a look."
        actions={
          <Button href="/super-admin/gyms/new">
            <FiPlus className="h-4 w-4" /> New gym
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Gyms" value={overview.gyms.total} hint={`${overview.gyms.active} active · ${overview.gyms.suspended} suspended`} icon={<FiGrid className="h-4 w-4" />} tone="accent" />
        <StatCard label="Renewing within 30 days" value={overview.expiring_within_30_days} hint={`${subs.trialing || 0} on trial`} icon={<FiClock className="h-4 w-4" />} tone="warn" />
        <StatCard label="Need attention" value={attentionCount} hint={`${subs.past_due || 0} past due · ${subs.expired || 0} expired · ${overview.gyms.suspended} suspended`} icon={<FiAlertCircle className="h-4 w-4" />} tone={attentionCount ? "bad" : "good"} />
        <StatCard
          label="Monthly recurring"
          value={overview.mrr.length ? overview.mrr.map((row) => formatMoney(row.amount, row.currency)).join(" · ") : formatMoney(0, overview.currency || DEFAULT_CURRENCY)}
          hint="Active subscriptions; yearly plans divided by 12"
          icon={<FiTrendingUp className="h-4 w-4" />}
          tone="good"
        />
      </div>

      {/* Wide screens: the mix and what is waiting in one column, the gyms
          needing a look beside them; a phone has them one under another. */}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-5 2xl:grid-cols-3">
        <div className="grid gap-6 md:grid-cols-2 lg:col-span-2 lg:grid-cols-1 2xl:col-span-1">
          <Panel title="Subscription mix" description="Where every gym sits in its billing life.">
            <SegmentBar
              segments={[
                { label: "Active", value: subs.active || 0, className: "bg-emerald-500" },
                { label: "Trialing", value: subs.trialing || 0, className: "bg-sky-500" },
                { label: "Past due", value: subs.past_due || 0, className: "bg-amber-500" },
                { label: "Expired", value: subs.expired || 0, className: "bg-rose-500" },
                { label: "Cancelled", value: subs.cancelled || 0, className: "bg-neutral-400" },
              ]}
            />
          </Panel>

          <Panel title="Waiting for you" description="Receipts to check and requests to answer." padded={false}>
            <ul className="divide-y divide-neutral-100">
              <InboxRow href="/super-admin/payment-requests" icon={<FiCheckSquare className="h-4 w-4" />} label="Payments to verify" count={overview.pending_count || 0} />
              <InboxRow href="/super-admin/demo-requests" icon={<FiInbox className="h-4 w-4" />} label="New demo requests" count={overview.demo_requests_new || 0} />
            </ul>
          </Panel>
        </div>

        <Panel
          title="Needs attention"
          description="Renewals due soon, payments overdue, gyms switched off."
          className="lg:col-span-3 2xl:col-span-2"
          actions={
            <Link href="/super-admin/gyms" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500">
              All gyms <FiArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
          padded={false}
        >
          {attentionCount === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-neutral-500">Nothing needs a look right now.</p>
          ) : (
            // A long list scrolls inside the card rather than push the gyms down.
            <ul className="admin-scroll max-h-[22rem] divide-y divide-neutral-100 overflow-y-auto">
              {attention.past_due.map((g) => {
                const status = overdueOf(g.id);
                return (
                  <AttentionRow
                    key={`pd-${g.id}`}
                    gym={g}
                    tone={status || "warn"}
                    label={status ? OVERDUE[status] : "Overdue"}
                    detail={g.currentPeriodEnd ? `period ended ${formatDate(g.currentPeriodEnd)}` : "no period end"}
                  />
                );
              })}
              {attention.renewing.map((g) => (
                <AttentionRow key={`rn-${g.id}`} gym={g} tone="warn" label="Renews" detail={g.currentPeriodEnd ? formatDate(g.currentPeriodEnd) : ""} />
              ))}
              {attention.suspended.map((g) => (
                <AttentionRow key={`su-${g.id}`} gym={g} tone="suspended" label="Suspended" detail="not being served" />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-8">
        <GymsTable title="Gyms" compact />
      </div>
    </>
  );
}

function AttentionRow({ gym, tone, label, detail }: { gym: { id: string; name: string; slug: string; plan?: string | null }; tone: string; label: string; detail: string }) {
  return (
    <li>
      <Link href={`/super-admin/gyms/${gym.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-neutral-50">
        <Avatar name={gym.name} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-neutral-900">{gym.name}</span>
          <span className="block truncate text-xs text-neutral-500">
            {gym.slug}
            {gym.plan ? ` · ${gym.plan}` : ""}
          </span>
        </span>
        <span className="text-right">
          <Pill tone={tone}>{label}</Pill>
          {detail && <span className="mt-1 block text-[11px] text-neutral-500">{detail}</span>}
        </span>
      </Link>
    </li>
  );
}

function InboxRow({ href, icon, label, count }: { href: string; icon: React.ReactNode; label: string; count: number }) {
  return (
    <li>
      <Link href={href} className="group flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-neutral-50">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">{icon}</span>
        <span className="min-w-0 flex-1 truncate font-medium text-neutral-700 group-hover:text-neutral-900">{label}</span>
        <span className={cx("min-w-[24px] rounded-full px-2 py-0.5 text-center text-xs font-semibold", count ? cx(ACCENT, "text-white") : "bg-neutral-100 text-neutral-500")}>{count}</span>
        <FiChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-500" aria-hidden="true" />
      </Link>
    </li>
  );
}

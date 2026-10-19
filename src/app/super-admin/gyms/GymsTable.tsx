"use client";

// The list of gyms, with search, status filters and the numbers from each
// gym's own database. Used on the overview (compact) and the Gyms page.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiSearch, FiArrowRight } from "react-icons/fi";
import { Avatar, Button, DataTable, EmptyState, Pill, Select, Spinner, StatusPill, inputClass, cx } from "../_shared/ui";
import { platformFetch, planOf, formatDate, type Gym } from "../_shared/api";

type Pagination = { page: number; page_size: number; total: number; pages: number };

export function SubscriptionBadge({ status }: { status: Gym["subscription"]["status"] }) {
  return <StatusPill status={status} />;
}

export default function GymsTable({ title, compact = false }: { title?: string; compact?: boolean }) {
  const router = useRouter();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [subscription, setSubscription] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), withStats: "1" });
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      if (subscription) params.set("subscription", subscription);
      const res = await platformFetch<{ data: Gym[]; pagination: Pagination }>(`/gyms?${params.toString()}`);
      setGyms(res.data);
      setPagination(res.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load gyms");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, subscription]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const columns = ["Gym", "Domains", "Plan", "Subscription", { label: "Members", align: "right" as const }, { label: "Active", align: "right" as const }, "Last activity", ...(compact ? [] : ["Database"])];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {title && (
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {pagination && <Pill tone="neutral" dot={false}>{pagination.total}</Pill>}
            {compact && (
              <Link href="/super-admin/gyms" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                View all <FiArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search name, slug, domain, owner…"
              className={cx(inputClass, "w-72 pl-9")}
            />
          </div>
          <Select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="w-40"
          >
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
          <Select
            value={subscription}
            onChange={(e) => {
              setPage(1);
              setSubscription(e.target.value);
            }}
            className="w-44"
          >
            <option value="">Any subscription</option>
            <option value="trialing">Trialing</option>
            <option value="active">Active</option>
            <option value="past_due">Past due</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}

      {loading ? (
        <Spinner />
      ) : !gyms.length ? (
        <EmptyState title="No gyms match" hint="Try a different search, or create a gym." action={<Button href="/super-admin/gyms/new">New gym</Button>} />
      ) : (
        <DataTable
          columns={columns}
          onRowClick={(i) => router.push(`/super-admin/gyms/${gyms[i].id}`)}
          rows={gyms.map((gym) => {
            const plan = planOf(gym);
            const stats = gym.stats || {};
            const hosts = gym.domains.map((d) => d.host);
            return [
              <div key="g" className="flex items-center gap-3">
                <Avatar name={gym.name} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{gym.name}</p>
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{gym.slug}</span>
                    {gym.status === "suspended" && <Pill tone="suspended">suspended</Pill>}
                  </p>
                </div>
              </div>,
              <div key="d" className="flex flex-wrap gap-1">
                {hosts.length ? (
                  <>
                    {hosts.slice(0, 2).map((h) => (
                      <span key={h} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                        {h}
                      </span>
                    ))}
                    {hosts.length > 2 && <span className="text-[11px] text-slate-500">+{hosts.length - 2}</span>}
                  </>
                ) : (
                  <span className="text-xs text-slate-400">none</span>
                )}
              </div>,
              <span key="p">{plan ? plan.name : <span className="text-slate-400">—</span>}</span>,
              <div key="s">
                <StatusPill status={gym.subscription.status} />
                <p className="mt-1 text-[11px] text-slate-500">{gym.subscription.currentPeriodEnd ? `until ${formatDate(gym.subscription.currentPeriodEnd)}` : "no end date"}</p>
              </div>,
              <span key="m" className="font-medium text-slate-900">{stats.error ? "—" : stats.members ?? "—"}</span>,
              <span key="a" className="font-medium text-slate-900">{stats.error ? "—" : stats.active_memberships ?? "—"}</span>,
              <span key="l" className="text-slate-600">{formatDate(stats.last_visit_at || stats.last_login_at)}</span>,
              ...(compact ? [] : [<span key="db" className="font-mono text-xs text-slate-500">{gym.database.name}</span>]),
            ];
          })}
        />
      )}

      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {pagination.page} of {pagination.pages} · {pagination.total} gyms
          </span>
          {/* The list shows it is loading; the page buttons wait for it. */}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={loading || page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={loading || page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

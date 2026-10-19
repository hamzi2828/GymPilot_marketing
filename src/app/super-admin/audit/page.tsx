"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, DataTable, Spinner, Alert, Avatar, Pill, relativeTime } from "../_shared/ui";
import { platformFetch } from "../_shared/api";

interface AuditRow {
  _id: string;
  actorEmail: string;
  action: string;
  gymId?: string | null;
  gymSlug: string;
  meta: Record<string, unknown> | null;
  ip: string;
  createdAt: string;
}

const TONE: Record<string, string> = {
  login: "neutral",
  gym_created: "good",
  gym_deleted: "bad",
  gym_suspended: "bad",
  gym_activated: "good",
  gym_owner_invite_sent: "neutral",
  gym_owner_password_reset: "warn",
  platform_stripe_event: "primary",
  password_reset: "warn",
  password_changed: "warn",
  two_factor_enabled: "good",
  two_factor_disabled: "warn",
  login_failed: "bad",
  password_change_failed: "bad",
  two_factor_disable_failed: "bad",
};

export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    platformFetch<{ data: AuditRow[] }>("/audit")
      .then((res) => setRows(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the audit log"));
  }, []);

  return (
    <>
      <PageHeader eyebrow="System" title="Audit log" description="Who did what from this panel: sign-ins, gyms created, suspended or deleted, subscriptions changed, passwords reset." />
      {error && <Alert tone="error">{error}</Alert>}
      {!rows ? (
        <Spinner />
      ) : (
        <DataTable
          columns={["When", "Who", "Action", "Gym", "Details"]}
          empty="Nothing recorded yet"
          rows={rows.map((row) => [
            <div key="w">
              <p className="whitespace-nowrap text-sm text-neutral-800">{relativeTime(row.createdAt)}</p>
              <p className="whitespace-nowrap text-[11px] text-neutral-400">{new Date(row.createdAt).toLocaleString()}</p>
            </div>,
            <div key="a" className="flex items-center gap-2.5">
              <Avatar name={row.actorEmail} size="sm" />
              <span className="text-sm text-neutral-800">{row.actorEmail}</span>
            </div>,
            <Pill key="x" tone={TONE[row.action] || "primary"} dot={false}>
              {row.action.replace(/_/g, " ")}
            </Pill>,
            row.gymSlug ? (
              row.gymId ? (
                <Link key="g" href={`/super-admin/gyms/${row.gymId}`} className="font-mono text-xs text-indigo-600 hover:underline">
                  {row.gymSlug}
                </Link>
              ) : (
                <span key="g" className="font-mono text-xs">{row.gymSlug}</span>
              )
            ) : (
              <span key="g" className="text-neutral-300">—</span>
            ),
            <span key="m" className="block max-w-md break-all font-mono text-[11px] leading-relaxed text-neutral-500 2xl:max-w-2xl">
              {row.meta ? JSON.stringify(row.meta) : ""}
              {row.ip && <span className="block text-neutral-400">from {row.ip}</span>}
            </span>,
          ])}
        />
      )}
    </>
  );
}

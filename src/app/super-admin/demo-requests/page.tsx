"use client";

// Demo requests from the marketing site: who asked, what gym, and where the
// conversation is. Status and notes are the only things edited here; "Set
// this gym up" turns one into a gym, which marks it converted.
//
// Signups that paid online (kind "signup") are listed here too. Those set
// themselves up when Stripe confirms the payment; the panel only has to act
// when one is stuck (see SIGNUP_STATE).

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiExternalLink, FiMail, FiPhone } from "react-icons/fi";
import { PageHeader, DataTable, Spinner, Alert, Avatar, Pill, Button, Modal, Field, Select, Textarea, relativeTime, cx, useAsyncAction } from "../_shared/ui";
import { platformFetch, formatMoney, DEMO_REQUEST_STATUSES, type DemoRequest, type DemoRequestStatus, type SignupState } from "../_shared/api";

const TONE: Record<DemoRequestStatus, string> = { new: "primary", contacted: "warn", converted: "good", closed: "neutral" };

const SIGNUP_STATE: Record<SignupState, { label: string; tone: string; help: string }> = {
  awaiting_payment: {
    label: "not paid",
    tone: "neutral",
    help: "Went to pay but has not finished. Nothing to do unless you want to follow up — if they pay, the gym sets itself up.",
  },
  provisioning: { label: "setting up", tone: "primary", help: "Paid; the gym is being set up right now." },
  // Whether the owner's set-password email went is said beside it (inviteSent).
  ready: { label: "live", tone: "good", help: "Paid and set up automatically." },
  failed: {
    label: "needs attention",
    tone: "bad",
    help: "Paid, but the gym could not be set up. Stripe retries for up to three days and each retry tries again. Fix the reason below, or set the gym up by hand: the next retry then attaches the payment to it.",
  },
};

export default function DemoRequestsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<DemoRequest[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<"" | DemoRequestStatus>("new");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<DemoRequest | null>(null);
  const [draft, setDraft] = useState({ status: "new" as DemoRequestStatus, notes: "" });
  // A save or delete that failed is said in the request's window, not behind it.
  const [formError, setFormError] = useState<string | null>(null);
  const action = useAsyncAction();
  const busy = action.busy;
  // The list is being fetched: it shows a spinner, and the filters wait.
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformFetch<{ data: DemoRequest[]; counts: Record<string, number> }>(`/demo-requests${filter ? `?status=${filter}` : ""}`);
      setRows(res.data);
      setCounts(res.counts || {});
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load demo requests");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const openRow = (r: DemoRequest) => {
    setOpen(r);
    setDraft({ status: r.status, notes: r.notes || "" });
    setFormError(null);
  };

  const save = () => {
    if (!open) return;
    action.run("save", async () => {
      setFormError(null);
      try {
        await platformFetch(`/demo-requests/${open.id}`, { method: "PATCH", body: draft });
        setOpen(null);
        await load();
      } catch (e) {
        setFormError(e instanceof Error ? e.message : "Could not save");
      }
    });
  };

  const remove = () => {
    // A signup that may still be paid for is what its gym is built from.
    const live = open?.signup && open.signup.state !== "ready" && open.signup.paymentStarted;
    const question = live
      ? `Delete the signup from ${open?.name}? If they pay (or have paid) for it, no gym can be made from it automatically any more. This cannot be undone.`
      : `Delete the request from ${open?.name}? This cannot be undone.`;
    if (!open || !window.confirm(question)) return;
    action.run("delete", async () => {
      setFormError(null);
      try {
        await platformFetch(`/demo-requests/${open.id}`, { method: "DELETE" });
        setOpen(null);
        await load();
      } catch (e) {
        setFormError(e instanceof Error ? e.message : "Could not delete");
      }
    });
  };

  // Every request can become a gym, whether or not it came with a plan. One
  // that already did is asked about first: a second go makes a second gym.
  // A signup sets itself up once paid, so doing it by hand is asked about too.
  const setUp = (r: DemoRequest) => {
    const already = !!r.gymId || r.status === "converted";
    if (already && !window.confirm(`${r.gymName || r.name} was already set up as a gym. Set up another gym from this request anyway?`)) return;
    if (!already && r.signup) {
      const question =
        r.signup.state === "provisioning"
          ? `${r.gymName || r.name} is being set up automatically right now. Set it up by hand anyway? That may make two gyms.`
          : r.signup.state === "failed"
          ? `${r.gymName || r.name} paid but could not be set up automatically. Set it up by hand? Stripe's next retry attaches the payment to the gym you make.`
          : `${r.gymName || r.name} has not paid yet. Set the gym up by hand anyway? If they pay later, the payment is attached to it.`;
      if (!window.confirm(question)) return;
    }
    router.push(`/super-admin/gyms/new?from=${r.id}`);
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Demo requests"
        description="Gyms that asked for a walkthrough or signed up on the website. Open one to record where the conversation is; online signups that paid set themselves up."
      />
      {error && <Alert tone="error" onDismiss={() => setError(null)}>{error}</Alert>}

      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-white p-1 sm:inline-flex">
        {[["", "All", total], ...DEMO_REQUEST_STATUSES.map((s) => [s, s[0].toUpperCase() + s.slice(1), counts[s] || 0])].map(([key, label, n]) => (
          <button key={String(key)} type="button" disabled={loading} onClick={() => setFilter(key as "" | DemoRequestStatus)} className={cx("inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-wait", filter === key ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100")}>
            {label}
            <span className={cx("rounded-full px-1.5 text-[11px] font-semibold", filter === key ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500")}>{n as number}</span>
          </button>
        ))}
      </div>

      {!rows || loading ? (
        <Spinner />
      ) : (
        <DataTable
          columns={["When", "Contact", "Gym", "Message", "Status"]}
          empty={filter === "new" ? "No new requests" : "Nothing here"}
          onRowClick={(i) => openRow(rows[i])}
          rows={rows.map((r) => [
            <div key="w">
              <p className="text-sm text-neutral-800">{relativeTime(r.createdAt)}</p>
              <p className="text-[11px] text-neutral-400">{new Date(r.createdAt).toLocaleString()}</p>
            </div>,
            <div key="c" className="flex items-center gap-2.5">
              <Avatar name={r.name} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">{r.name}</p>
                <p className="truncate text-xs text-neutral-500">{r.email}</p>
                {r.phone && <p className="truncate text-xs text-neutral-500">{r.phone}</p>}
              </div>
            </div>,
            <div key="g" className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">
                {r.gymName || "—"}
                {r.kind === "trial" && (
                  <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                    checkout
                  </span>
                )}
                {r.kind === "signup" && (
                  <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    online signup
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-neutral-500">
                {r.plan
                  ? `${r.plan.name} · ${formatMoney(r.plan.amount, r.plan.currency)} / ${r.plan.billingCycle === "yearly" ? "yr" : "mo"}${
                      r.plan.addonNames.length ? ` · ${r.plan.addonNames.join(", ")}` : ""
                    }`
                  : [r.gymSize, r.country].filter(Boolean).join(" · ")}
              </p>
            </div>,
            <p key="m" className="max-w-md truncate text-xs text-neutral-600" title={r.message}>
              {r.message || <span className="text-neutral-300">—</span>}
            </p>,
            <div key="s" className="space-y-1">
              <Pill tone={TONE[r.status] || "neutral"}>{r.status}</Pill>
              {r.signup && SIGNUP_STATE[r.signup.state] && (
                <div>
                  <Pill tone={SIGNUP_STATE[r.signup.state].tone} dot={false}>
                    {SIGNUP_STATE[r.signup.state].label}
                  </Pill>
                </div>
              )}
              {r.gymId && <p className="text-[11px] text-neutral-500">gym set up</p>}
            </div>,
          ])}
        />
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `${open.name} · ${open.gymName || "demo request"}` : ""} size="md">
        {open && (
          <div className="space-y-5">
            {formError && <Alert tone="error">{formError}</Alert>}
            <div className="flex flex-wrap gap-2">
              <a href={`mailto:${open.email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                <FiMail className="h-3.5 w-3.5" /> {open.email}
              </a>
              {open.phone && (
                <a href={`tel:${open.phone}`} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                  <FiPhone className="h-3.5 w-3.5" /> {open.phone}
                </a>
              )}
            </div>
            {open.signup && SIGNUP_STATE[open.signup.state] && (
              <div className={cx("rounded-xl border p-4", open.signup.state === "failed" ? "border-rose-200 bg-rose-50/60" : "border-emerald-200 bg-emerald-50/50")}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">Online signup</p>
                  <Pill tone={SIGNUP_STATE[open.signup.state].tone} dot={false}>
                    {SIGNUP_STATE[open.signup.state].label}
                  </Pill>
                </div>
                <p className="mt-2 text-sm text-neutral-700">
                  {open.signup.state === "awaiting_payment" && !open.signup.paymentStarted
                    ? "Never reached the payment page. Nothing to do unless you want to follow up."
                    : SIGNUP_STATE[open.signup.state].help}
                </p>
                {open.signup.error && (
                  <p className="mt-2 rounded-lg bg-white/70 p-2 font-mono text-xs text-rose-800">
                    {open.signup.error}
                    {open.signup.attempts > 1 ? ` (attempt ${open.signup.attempts})` : ""}
                  </p>
                )}
                {open.signup.state === "ready" &&
                  (open.signup.inviteSent ? (
                    <p className="mt-2 text-sm text-neutral-700">The owner was emailed their set-password link.</p>
                  ) : (
                    <p className="mt-2 text-sm font-medium text-amber-800">
                      The set-password email did not go out: open the gym and use Resend owner invite, or Reset owner password to set one by hand.
                    </p>
                  ))}
                {(open.warnings || []).length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-neutral-600">
                    {(open.warnings || []).map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                )}
                {(open.signup.siteUrl || open.signup.stripeSubscriptionId) && (
                  <dl className="mt-3 space-y-1 text-xs">
                    {open.signup.siteUrl && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-neutral-500">Website</dt>
                        <dd>
                          <a href={open.signup.siteUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:text-indigo-700">
                            {open.signup.siteUrl.replace(/^https?:\/\//, "")}
                          </a>
                        </dd>
                      </div>
                    )}
                    {open.signup.stripeSubscriptionId && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-neutral-500">Stripe</dt>
                        <dd className="font-mono text-neutral-700">
                          {open.signup.stripeCustomerId} · {open.signup.stripeSubscriptionId}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            )}

            {open.plan && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">{open.signup ? "Paid for online" : "Chose at checkout"}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Plan</span>
                    <span className="font-semibold text-neutral-900">
                      {open.plan.name} · {open.plan.billingCycle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Add-ons</span>
                    <span className="font-medium text-neutral-900">{open.plan.addonNames.join(", ") || "none"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Trial</span>
                    <span className="font-medium text-neutral-900">{open.plan.trialDays ? `${open.plan.trialDays} days` : "none"}</span>
                  </div>
                  <div className="flex justify-between border-t border-indigo-200 pt-1.5">
                    <span className="font-semibold text-neutral-900">Then</span>
                    <span className="font-semibold text-neutral-900">
                      {formatMoney(open.plan.amount, open.plan.currency)} / {open.plan.billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  </div>
                  {open.preferredSlug && (
                    <div className="flex justify-between pt-1.5">
                      <span className="text-neutral-600">Web address wanted</span>
                      <span className="font-mono text-xs text-neutral-900">{open.preferredSlug}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              {open.gymId ? (
                <p className="text-sm text-neutral-700">
                  Set up as a gym{open.convertedAt ? ` on ${new Date(open.convertedAt).toLocaleDateString()}` : ""}.{" "}
                  <Link href={`/super-admin/gyms/${open.gymId}`} className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700">
                    Open the gym <FiExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </p>
              ) : (
                <p className="text-xs text-neutral-500">
                  {open.plan ? "Everything they chose is filled in for you." : "No plan was chosen: pick one on the next page."}
                </p>
              )}
              <Button size="sm" variant={open.gymId ? "secondary" : "primary"} onClick={() => setUp(open)}>
                {open.gymId ? "Set up another gym" : "Set this gym up"}
              </Button>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Gym size</dt>
                <dd className="text-neutral-800">{open.gymSize || "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Country / city</dt>
                <dd className="text-neutral-800">{open.country || "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Message</dt>
                <dd className="whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 text-neutral-800">{open.message || "—"}</dd>
              </div>
              <div className="col-span-2 text-xs text-neutral-500">
                Received {new Date(open.createdAt).toLocaleString()}
                {open.source ? ` · from ${open.source}` : ""}
              </div>
            </dl>
            <Field label="Status">
              <Select value={draft.status} onChange={(e) => setDraft((x) => ({ ...x, status: e.target.value as DemoRequestStatus }))}>
                {DEMO_REQUEST_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Notes">
              <Textarea value={draft.notes} onChange={(e) => setDraft((x) => ({ ...x, notes: e.target.value }))} placeholder="Call booked for Tuesday, wants Stripe + bank transfer…" />
            </Field>
            <div className="flex items-center justify-between gap-2">
              <Button variant="danger" size="sm" onClick={remove} disabled={busy} loading={action.pending === "delete"}>
                Delete
              </Button>
              <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setOpen(null)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={save} disabled={busy} loading={action.pending === "save"}>
                {action.pending === "save" ? "Saving…" : "Save"}
              </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

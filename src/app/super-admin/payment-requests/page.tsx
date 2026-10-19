"use client";

// Payments to verify: receipts gyms sent for a bank transfer to
// GymsPilotPro. Approve records the payment and moves the gym's paid-until
// date on (the API does it once, however often it is asked); Reject sends a
// reason back, and the gym can upload again.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FiCheck, FiFileText, FiRefreshCw, FiX } from "react-icons/fi";
import { Alert, Button, EmptyState, Modal, PageHeader, Spinner, Textarea, cx, relativeTime, useAsyncAction } from "../_shared/ui";
import { PAYMENT_REQUESTS_CHANGED, formatDate, formatMoney, platformFetch, uploadUrl, type PlatformPaymentRequest } from "../_shared/api";

const CYCLE: Record<string, string> = { monthly: "Monthly", yearly: "Yearly" };

const isPdf = (url: string) => /\.pdf($|[?#])/i.test(url);

type Decision = { request: PlatformPaymentRequest; kind: "approve" | "reject" };

type ReviewResponse = {
  data?: { request?: PlatformPaymentRequest; subscription?: { currentPeriodEnd?: string | null } | null; emailed?: boolean };
  emailed?: boolean;
};

/** The receipt, small: a picture to open, or a PDF to open. */
function Receipt({ url, size = "sm" }: { url: string; size?: "sm" | "lg" }) {
  const [broken, setBroken] = useState(false);
  const href = uploadUrl(url);
  const box = size === "lg" ? "h-auto max-h-[36vh] w-full" : "h-20 w-20";
  if (!href) {
    return <span className={cx("flex shrink-0 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-[11px] text-neutral-400", size === "lg" ? "h-32 w-full" : "h-20 w-20")}>No receipt</span>;
  }
  if (isPdf(href) || broken) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cx("flex shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-semibold text-indigo-600 hover:bg-indigo-50", size === "lg" ? "h-32 w-full" : "h-20 w-20")}>
        <FiFileText className="h-5 w-5" aria-hidden="true" />
        {isPdf(href) ? "Open PDF" : "Open file"}
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block shrink-0" title="Open the receipt">
      {/* eslint-disable-next-line @next/next/no-img-element -- an uploaded file on the API or the Blob store */}
      <img src={href} alt="Receipt" onError={() => setBroken(true)} className={cx("rounded-lg border border-neutral-200 bg-white object-contain", box)} />
    </a>
  );
}

export default function PaymentRequestsPage() {
  const [rows, setRows] = useState<PlatformPaymentRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const action = useAsyncAction();

  const load = useCallback(async () => {
    try {
      const res = await platformFetch<{ data: PlatformPaymentRequest[]; total?: number }>("/payment-requests?status=pending");
      setRows(res.data || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the payments to verify");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = (request: PlatformPaymentRequest, kind: Decision["kind"]) => {
    setDecision({ request, kind });
    setReason("");
    setModalError(null);
  };

  const close = () => {
    if (action.pending === "decide") return;
    setDecision(null);
  };

  const decide = () =>
    action.run("decide", async () => {
      if (!decision) return;
      const { request, kind } = decision;
      if (kind === "reject" && !reason.trim()) return;
      setModalError(null);
      try {
        const res = await platformFetch<ReviewResponse>(`/payment-requests/${encodeURIComponent(request.id)}/${kind}`, {
          method: "POST",
          body: kind === "reject" ? { reason: reason.trim() } : {},
        });
        const emailed = res.emailed ?? res.data?.emailed;
        const until = res.data?.subscription?.currentPeriodEnd;
        const what =
          kind === "approve"
            ? `Approved — ${request.gymName}${until ? ` is paid until ${formatDate(until)}` : " is paid"}.`
            : `Rejected — ${request.gymName} can upload again.`;
        setDone(`${what}${emailed ? " Owner emailed." : ""}`);
        setRows((list) => (list || []).filter((r) => r.id !== request.id));
        setDecision(null);
        window.dispatchEvent(new Event(PAYMENT_REQUESTS_CHANGED));
      } catch (e) {
        setModalError(e instanceof Error ? e.message : kind === "approve" ? "Could not approve" : "Could not reject");
      }
    });

  const refresh = () =>
    action.run("refresh", async () => {
      await load();
      window.dispatchEvent(new Event(PAYMENT_REQUESTS_CHANGED));
    });

  const count = rows?.length || 0;
  const r = decision?.request;
  const approving = decision?.kind === "approve";
  const deciding = action.pending === "decide";

  return (
    <div>
      <PageHeader
        eyebrow="Manage"
        title="Payments to verify"
        description={rows === null ? "Receipts gyms sent for a bank transfer." : count ? `${count} waiting.` : "Receipts gyms sent for a bank transfer."}
        actions={
          <Button variant="secondary" onClick={refresh} loading={action.pending === "refresh"} disabled={action.busy}>
            <FiRefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      {error && (
        <Alert tone="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      {done && (
        <Alert tone="success" onDismiss={() => setDone(null)}>
          {done}
        </Alert>
      )}

      {rows === null ? (
        error ? null : <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title="Nothing to verify" hint="Receipts gyms upload show up here." icon={<FiCheck className="h-5 w-5" />} />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2 min-[1800px]:grid-cols-3">
          {rows.map((row) => (
            <li key={row.id} className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5">
              <div className="flex gap-4">
                <Receipt url={row.receiptUrl} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="min-w-0 truncate text-sm font-semibold text-neutral-900">
                      {row.gymId ? (
                        <Link href={`/super-admin/gyms/${row.gymId}`} className="hover:text-indigo-700 hover:underline">
                          {row.gymName || row.gymSlug}
                        </Link>
                      ) : (
                        row.gymName || row.gymSlug
                      )}
                    </p>
                    <p className="text-base font-semibold text-neutral-900">{formatMoney(row.amount, row.currency)}</p>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">
                    <span className="font-mono">{row.gymSlug}</span>
                    {row.billingCycle && <> · {CYCLE[row.billingCycle] || row.billingCycle}</>}
                    {" · "}
                    <span title={row.submittedAt ? new Date(row.submittedAt).toLocaleString() : undefined}>{relativeTime(row.submittedAt)}</span>
                  </p>
                  {row.reference && (
                    <p className="mt-1.5 truncate text-xs text-neutral-600">
                      Ref <span className="font-mono text-neutral-800">{row.reference}</span>
                    </p>
                  )}
                  {row.note && <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{row.note}</p>}
                  {row.submittedBy?.email && <p className="mt-1 truncate text-[11px] text-neutral-400">By {row.submittedBy.name ? `${row.submittedBy.name} · ` : ""}{row.submittedBy.email}</p>}
                </div>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-2 pt-4 sm:flex sm:justify-end">
                <Button variant="danger" onClick={() => open(row, "reject")} disabled={action.busy}>
                  <FiX className="h-4 w-4" /> Reject
                </Button>
                <Button onClick={() => open(row, "approve")} disabled={action.busy}>
                  <FiCheck className="h-4 w-4" /> Approve
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!decision} onClose={close} title={approving ? "Approve this payment?" : "Reject this receipt?"} size="sm">
        {r && (
          <>
            {modalError && <Alert tone="error">{modalError}</Alert>}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
              <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="font-semibold text-neutral-900">{r.gymName || r.gymSlug}</span>
                <span className="font-semibold text-neutral-900">{formatMoney(r.amount, r.currency)}</span>
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {CYCLE[r.billingCycle] || r.billingCycle}
                {r.reference ? ` · Ref ${r.reference}` : ""}
              </p>
              {approving && (
                <div className="mt-3">
                  <Receipt url={r.receiptUrl} size="lg" />
                </div>
              )}
            </div>

            {approving ? (
              <p className="mt-4 text-sm text-neutral-600">This records the payment and extends their plan by one {r.billingCycle === "yearly" ? "year" : "month"}.</p>
            ) : (
              <label className="mt-4 block">
                <span className="text-xs font-semibold text-neutral-700">Reason</span>
                <Textarea className="mt-1.5" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="The amount does not match." autoFocus />
                <span className="mt-1.5 block text-xs text-neutral-500">The gym sees this and can upload again.</span>
              </label>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={close} disabled={deciding}>
                Cancel
              </Button>
              {approving ? (
                <Button onClick={decide} loading={deciding}>
                  <FiCheck className="h-4 w-4" /> {deciding ? "Approving…" : "Approve"}
                </Button>
              ) : (
                <Button variant="danger" onClick={decide} loading={deciding} disabled={!reason.trim()}>
                  <FiX className="h-4 w-4" /> {deciding ? "Rejecting…" : "Reject"}
                </Button>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

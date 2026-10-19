"use client";

// A gym's payments taken outside Stripe -- bank transfer, JazzCash,
// Easypaisa, cash -- and the form that records one. Saving a payment moves
// the gym's paid-until date and switches a lapsed gym back on; the API does
// both, this only asks for it once.

import { useCallback, useEffect, useRef, useState } from "react";
import { FiFileText } from "react-icons/fi";
import { Panel, Button, Field, Input, Select, Textarea, Modal, Alert, DataTable } from "../../_shared/ui";
import { platformFetch, formatDate, formatMoney, type GymPayment, type PaymentTerms } from "../../_shared/api";

// These always come with a transaction id; the API asks for it too.
const NEEDS_REFERENCE = ["bank_transfer", "jazzcash", "easypaisa"];

const day = (value?: string | null) => (value ? String(value).slice(0, 10) : "");
// The admin's own date, as YYYY-MM-DD.
const today = () => new Date().toLocaleDateString("en-CA");
// One per time the form is opened: a second click on Save sends the same
// one, and the API treats it as the same payment.
const newRequestId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

const EMPTY = { amount: "", method: "bank_transfer", receivedAt: "", reference: "", note: "", paidUntil: "", requestId: "" };

export function PaymentsPanel({
  gymId,
  gymName,
  reloadKey,
  onRecorded,
}: {
  gymId: string;
  gymName: string;
  /** Changes whenever the gym does, so the next paid-until date is worked out afresh. */
  reloadKey?: string;
  /** Called once a payment is saved, with what to tell the admin. */
  onRecorded: (message: string, warnings: string[]) => void;
}) {
  const [payments, setPayments] = useState<GymPayment[] | null>(null);
  const [terms, setTerms] = useState<PaymentTerms | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // State is too slow to stop a double click; this is not.
  const sending = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await platformFetch<{ data: GymPayment[]; next: PaymentTerms }>(`/gyms/${gymId}/payments`);
      setPayments(res.data);
      setTerms(res.next);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load this gym's payments");
    }
  }, [gymId]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const openForm = () => {
    if (!terms) return;
    setForm({ ...EMPTY, amount: terms.amount ? String(terms.amount) : "", receivedAt: today(), paidUntil: day(terms.paidUntil), requestId: newRequestId() });
    setFormError(null);
    setOpen(true);
  };

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const needsReference = NEEDS_REFERENCE.includes(form.method);
  const incomplete = !(Number(form.amount) > 0) || !form.receivedAt || !form.paidUntil || (needsReference && !form.reference.trim());

  const save = async () => {
    if (sending.current || incomplete) return;
    sending.current = true;
    setSaving(true);
    setFormError(null);
    try {
      const res = await platformFetch<{ data: GymPayment; warnings?: string[] }>(`/gyms/${gymId}/payments`, {
        method: "POST",
        body: { amount: Number(form.amount), method: form.method, receivedAt: form.receivedAt, reference: form.reference.trim(), note: form.note.trim(), paidUntil: form.paidUntil, requestId: form.requestId },
      });
      setOpen(false);
      await load();
      onRecorded(`Payment recorded. ${gymName} is paid until ${formatDate(res.data.periodTo)}.`, res.warnings || []);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not record the payment");
    } finally {
      sending.current = false;
      setSaving(false);
    }
  };

  const unit = terms?.billingCycle === "yearly" ? "year" : "month";
  // Already paid past today: the payment adds a cycle to that date.
  const paidAhead = !!terms && day(terms.paidFrom) > today();

  return (
    <>
      <Panel
        title={
          <span className="flex items-center gap-2">
            <FiFileText className="h-4 w-4 text-neutral-400" /> Payments received
          </span>
        }
        description={
          terms && !terms.canRecord
            ? terms.reason
            : "Bank transfer, JazzCash, Easypaisa or cash. Recording a payment moves the paid-until date on and switches the gym back on if it had lapsed."
        }
        actions={
          terms?.canRecord ? (
            <Button size="sm" onClick={openForm}>
              Record payment
            </Button>
          ) : undefined
        }
        padded={false}
      >
        {loadError ? (
          <p className="px-5 py-5 text-xs text-rose-600">{loadError}</p>
        ) : payments === null ? (
          <p className="px-5 py-5 text-xs text-neutral-500">Loading…</p>
        ) : !payments.length ? (
          <p className="px-5 py-5 text-xs text-neutral-500">No payments recorded yet.</p>
        ) : (
          <div className="p-4">
            <DataTable
              columns={["Received", { label: "Amount", align: "right" }, "Method", "Reference", "Paid until", "Recorded by"]}
              rows={payments.map((p) => [
                formatDate(p.receivedAt),
                <span key="amount" className="font-medium text-neutral-900">{formatMoney(p.amount, p.currency)}</span>,
                p.methodLabel,
                <span key="reference" className="font-mono text-xs" title={p.note || undefined}>{p.reference || "—"}</span>,
                formatDate(p.periodTo),
                <span key="by" className="text-xs text-neutral-500">{p.recordedBy || "—"}</span>,
              ])}
            />
          </div>
        )}
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title={`Record a payment from ${gymName}`} size="md">
        {formError && <Alert tone="error">{formError}</Alert>}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={`Amount received (${terms?.currency || ""})`}>
            <Input type="number" min={0} value={form.amount} onChange={set("amount")} />
          </Field>
          <Field label="Paid by">
            <Select value={form.method} onChange={set("method")}>
              {(terms?.methods || []).map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date received">
            <Input type="date" value={form.receivedAt} max={today()} onChange={set("receivedAt")} />
          </Field>
          <Field label={needsReference ? "Reference (transaction id)" : "Reference (optional)"}>
            <Input value={form.reference} onChange={set("reference")} maxLength={120} className="font-mono" />
          </Field>
          <div className="md:col-span-2">
            <Field
              label="Paid until"
              hint={`${paidAhead ? `Already paid until ${formatDate(terms?.paidFrom)}, so this adds one ${unit} to that.` : `One ${unit} from today.`} Change the date only if you agreed something different.`}
            >
              <Input type="date" value={form.paidUntil} onChange={set("paidUntil")} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Note (optional)">
              <Textarea value={form.note} onChange={set("note")} maxLength={1000} />
            </Field>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={incomplete} loading={saving} onClick={save}>
            {saving ? "Saving…" : "Save payment"}
          </Button>
        </div>
      </Modal>
    </>
  );
}

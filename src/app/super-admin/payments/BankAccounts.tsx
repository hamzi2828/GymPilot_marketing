"use client";

// GymsPilotPro's own bank accounts: what a gym that pays by bank transfer is
// shown, with the QR code to scan. Each change is saved as it is made (its
// own window, its own switch), not by the page's Save bar.

import { useEffect, useRef, useState } from "react";
import { FiEdit2, FiPlus, FiTrash2, FiUpload } from "react-icons/fi";
import { LuLandmark } from "react-icons/lu";
import { Alert, Button, Field, Input, Modal, Toggle, useAsyncAction } from "../_shared/ui";
import { platformFetch, platformUpload, uploadUrl, type PlatformBankAccount } from "../_shared/api";

const idOf = (b: PlatformBankAccount) => b.id || b._id || "";

const QR_TYPES = ["image/png", "image/jpeg", "image/webp"];
const QR_MAX_MB = 5;

type BankResponse = { data?: { bankAccounts?: PlatformBankAccount[] } };

const EMPTY = { bankName: "", accountTitle: "", accountNumber: "", iban: "", active: true };

export default function BankAccounts({ accounts, onChange }: { accounts: PlatformBankAccount[]; onChange: (next: PlatformBankAccount[]) => void }) {
  // The window: closed, a new account ("new"), or the id of the one edited.
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PlatformBankAccount | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const action = useAsyncAction();

  // A chosen picture is shown from memory until it is uploaded; let it go after.
  useEffect(() => {
    if (!qrFile) {
      setQrPreview("");
      return;
    }
    const url = URL.createObjectURL(qrFile);
    setQrPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [qrFile]);

  const current = editing && editing !== "new" ? accounts.find((b) => idOf(b) === editing) || null : null;

  const openNew = () => {
    setForm(EMPTY);
    setQrFile(null);
    setFormError(null);
    setEditing("new");
  };

  const openEdit = (b: PlatformBankAccount) => {
    setForm({ bankName: b.bankName || "", accountTitle: b.accountTitle || "", accountNumber: b.accountNumber || "", iban: b.iban || "", active: b.active !== false });
    setQrFile(null);
    setFormError(null);
    setEditing(idOf(b));
  };

  const close = () => {
    if (action.pending === "save") return;
    setEditing(null);
  };

  const pickQr = (file: File | undefined) => {
    if (!file) return;
    if (!QR_TYPES.includes(file.type)) {
      setFormError("The QR code must be a PNG, JPG or WebP picture.");
      return;
    }
    if (file.size > QR_MAX_MB * 1024 * 1024) {
      setFormError(`The QR code picture must be under ${QR_MAX_MB} MB.`);
      return;
    }
    setFormError(null);
    setQrFile(file);
  };

  const incomplete = !form.bankName.trim() || !form.accountTitle.trim() || (!form.accountNumber.trim() && !form.iban.trim());

  const save = () =>
    action.run("save", async () => {
      if (incomplete) return;
      setFormError(null);
      const body = { bankName: form.bankName.trim(), accountTitle: form.accountTitle.trim(), accountNumber: form.accountNumber.trim(), iban: form.iban.trim().toUpperCase(), active: form.active };
      let id = editing === "new" ? "" : editing || "";
      try {
        const before = new Set(accounts.map(idOf));
        const res =
          editing === "new"
            ? await platformFetch<BankResponse & { data?: { bankAccount?: PlatformBankAccount } }>("/settings/bank-accounts", { method: "POST", body })
            : await platformFetch<BankResponse>(`/settings/bank-accounts/${encodeURIComponent(id)}`, { method: "PUT", body });
        const list = res.data?.bankAccounts || accounts;
        onChange(list);
        if (editing === "new") {
          const created = (res.data as { bankAccount?: PlatformBankAccount } | undefined)?.bankAccount;
          id = (created && idOf(created)) || idOf(list.find((b) => !before.has(idOf(b))) || ({} as PlatformBankAccount));
        }
      } catch (e) {
        setFormError(e instanceof Error ? e.message : "Could not save the bank account");
        return;
      }
      if (qrFile && id) {
        try {
          const data = new FormData();
          data.append("qrCode", qrFile);
          const res = await platformUpload<BankResponse>(`/settings/bank-accounts/${encodeURIComponent(id)}/qr`, data);
          if (res.data?.bankAccounts) onChange(res.data.bankAccounts);
        } catch (e) {
          // The account itself is saved: the window stays open on it, so the
          // picture can be tried again without typing anything twice.
          setEditing(id);
          setFormError(`Saved, but the QR code did not upload: ${e instanceof Error ? e.message : "try again"}`);
          return;
        }
      }
      setEditing(null);
    });

  const setActive = (b: PlatformBankAccount, active: boolean) =>
    action.run(`active:${idOf(b)}`, async () => {
      setRowError(null);
      try {
        const res = await platformFetch<BankResponse>(`/settings/bank-accounts/${encodeURIComponent(idOf(b))}`, { method: "PUT", body: { active } });
        onChange(res.data?.bankAccounts || accounts.map((x) => (idOf(x) === idOf(b) ? { ...x, active } : x)));
      } catch (e) {
        setRowError(e instanceof Error ? e.message : "Could not change the bank account");
      }
    });

  const remove = () =>
    action.run("delete", async () => {
      if (!deleting) return;
      setDeleteError(null);
      try {
        const res = await platformFetch<BankResponse>(`/settings/bank-accounts/${encodeURIComponent(idOf(deleting))}`, { method: "DELETE" });
        onChange(res.data?.bankAccounts || accounts.filter((x) => idOf(x) !== idOf(deleting)));
        setDeleting(null);
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : "Could not delete the bank account");
      }
    });

  const set = (key: "bankName" | "accountTitle" | "accountNumber" | "iban") => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const shownQr = qrPreview || uploadUrl(current?.qrCodeUrl);

  return (
    <>
      {rowError && (
        <Alert tone="error" onDismiss={() => setRowError(null)}>
          {rowError}
        </Alert>
      )}

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-neutral-900">No bank account yet</p>
          <p className="mt-0.5 text-xs text-neutral-500">Add one so gyms know where to pay.</p>
          <Button className="mt-4" onClick={openNew} disabled={action.busy}>
            <FiPlus className="h-4 w-4" /> Add bank account
          </Button>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
            {accounts.map((b) => {
              const qr = uploadUrl(b.qrCodeUrl);
              const on = b.active !== false;
              return (
                <li key={idOf(b)} className="flex flex-wrap items-center gap-x-3 gap-y-3 px-3 py-3 sm:px-4">
                  {qr ? (
                    // eslint-disable-next-line @next/next/no-img-element -- an uploaded file on the API or the Blob store
                    <img src={qr} alt={`QR code for ${b.bankName}`} className="h-11 w-11 shrink-0 rounded-lg border border-neutral-200 bg-white object-contain p-0.5" />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500" aria-hidden="true">
                      <LuLandmark className="h-5 w-5" />
                    </span>
                  )}
                  <div className={`min-w-0 flex-1 ${on ? "" : "opacity-60"}`}>
                    <p className="truncate text-sm font-semibold text-neutral-900">{b.bankName}</p>
                    <p className="break-words text-xs text-neutral-500">{[b.accountTitle, b.accountNumber].filter(Boolean).join(" · ")}</p>
                    {b.iban && <p className="break-all font-mono text-[11px] text-neutral-500">{b.iban}</p>}
                  </div>
                  <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                    <Toggle label={on ? "Shown" : "Hidden"} checked={on} onChange={(v) => setActive(b, v)} disabled={action.busy} />
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(b)} disabled={action.busy}>
                        <FiEdit2 className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleting(b);
                        }}
                        disabled={action.busy}
                      >
                        <FiTrash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <Button variant="secondary" className="mt-3" onClick={openNew} disabled={action.busy}>
            <FiPlus className="h-4 w-4" /> Add bank account
          </Button>
        </>
      )}

      <Modal open={editing !== null} onClose={close} title={editing === "new" ? "Add bank account" : "Edit bank account"} size="md">
        {formError && <Alert tone="error">{formError}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bank name">
            <Input value={form.bankName} onChange={set("bankName")} maxLength={120} placeholder="Meezan Bank" />
          </Field>
          <Field label="Account title">
            <Input value={form.accountTitle} onChange={set("accountTitle")} maxLength={120} placeholder="GymsPilotPro" />
          </Field>
          <Field label="Account number">
            <Input value={form.accountNumber} onChange={set("accountNumber")} maxLength={60} inputMode="numeric" className="font-mono" />
          </Field>
          <Field label="IBAN" hint="Account number or IBAN — one is enough.">
            <Input value={form.iban} onChange={set("iban")} maxLength={40} className="font-mono uppercase" spellCheck={false} />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
          {shownQr ? (
            // eslint-disable-next-line @next/next/no-img-element -- a picture chosen on this computer, or one already uploaded
            <img src={shownQr} alt="QR code" className="h-28 w-28 shrink-0 rounded-lg border border-neutral-200 bg-white object-contain p-1" />
          ) : (
            <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white text-center text-xs text-neutral-400">No QR code</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900">QR code</p>
            <p className="mt-0.5 text-xs text-neutral-500">Optional. Gyms scan it to pay.</p>
            <input ref={fileInput} type="file" accept={QR_TYPES.join(",")} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => {
              pickQr(e.target.files?.[0]);
              e.target.value = "";
            }} />
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => fileInput.current?.click()} disabled={action.busy}>
              <FiUpload className="h-3.5 w-3.5" /> {shownQr ? "Change picture" : "Upload picture"}
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <Toggle label="Show to gyms" checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} />
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={close} disabled={action.pending === "save"}>
            Cancel
          </Button>
          <Button onClick={save} disabled={incomplete || (action.busy && action.pending !== "save")} loading={action.pending === "save"}>
            {action.pending === "save" ? "Saving…" : "Save"}
          </Button>
        </div>
      </Modal>

      <Modal open={deleting !== null} onClose={() => action.pending !== "delete" && setDeleting(null)} title="Delete bank account?" size="sm">
        {deleteError && <Alert tone="error">{deleteError}</Alert>}
        <p className="text-sm text-neutral-600">
          <span className="font-semibold text-neutral-900">{deleting?.bankName}</span>
          {deleting?.accountNumber ? ` · ${deleting.accountNumber}` : ""} — gyms stop seeing it.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setDeleting(null)} disabled={action.pending === "delete"}>
            Cancel
          </Button>
          <Button variant="danger" onClick={remove} loading={action.pending === "delete"}>
            <FiTrash2 className="h-4 w-4" /> {action.pending === "delete" ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Modal>
    </>
  );
}

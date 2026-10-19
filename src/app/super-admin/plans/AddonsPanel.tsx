"use client";

// What we sell beside the plans. The member app is the first of them; the
// shape is deliberately general (extra branch, WhatsApp credits, a second
// front desk) so the next one is a form fill rather than a release.

import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import { Alert, Button, Field, Input, Modal, Panel, Pill, Select, Textarea, Toggle, useAsyncAction } from "../_shared/ui";
import { formatMoney, platformFetch, type Addon, type Plan } from "../_shared/api";

const CURRENCIES = ["PKR", "USD", "GBP", "EUR", "AED", "SAR", "INR"];

type Draft = {
  name: string;
  slug: string;
  description: string;
  monthly: string;
  yearly: string;
  currency: string;
  planSlugs: string[];
  isPublic: boolean;
  isActive: boolean;
  order: string;
};

const emptyDraft: Draft = {
  name: "",
  slug: "",
  description: "",
  monthly: "0",
  yearly: "0",
  currency: "PKR",
  planSlugs: [],
  isPublic: true,
  isActive: true,
  order: "0",
};

function toDraft(addon: Addon): Draft {
  return {
    name: addon.name,
    slug: addon.slug,
    description: addon.description || "",
    monthly: String(addon.price.monthly),
    yearly: String(addon.price.yearly),
    currency: addon.price.currency,
    planSlugs: addon.planSlugs || [],
    isPublic: addon.isPublic,
    isActive: addon.isActive,
    order: String(addon.order),
  };
}

export default function AddonsPanel({ plans, addons, onChanged }: { plans: Plan[]; addons: Addon[]; onChanged: () => Promise<void> | void }) {
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Addon | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  // A save that failed is said in the form, not behind it.
  const [formError, setFormError] = useState<string | null>(null);
  const action = useAsyncAction();
  const busy = action.busy;

  const openNew = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setFormError(null);
    setOpen(true);
  };
  const openEdit = (addon: Addon) => {
    setEditing(addon);
    setDraft(toDraft(addon));
    setFormError(null);
    setOpen(true);
  };

  const save = () =>
    action.run("save", async () => {
      setError(null);
      setFormError(null);
      const body = {
        name: draft.name,
        slug: draft.slug || undefined,
        description: draft.description,
        price: { monthly: Number(draft.monthly) || 0, yearly: Number(draft.yearly) || 0, currency: draft.currency },
        planSlugs: draft.planSlugs,
        isPublic: draft.isPublic,
        isActive: draft.isActive,
        order: Number(draft.order) || 0,
      };
      try {
        if (editing) await platformFetch(`/addons/${editing.id}`, { method: "PUT", body });
        else await platformFetch("/addons", { method: "POST", body });
        setOpen(false);
        await onChanged();
      } catch (e) {
        setFormError(e instanceof Error ? e.message : "Could not save the add-on");
      }
    });

  const remove = (addon: Addon) => {
    if (!window.confirm(`Delete the "${addon.name}" add-on?`)) return;
    action.run(`delete:${addon.id}`, async () => {
      try {
        await platformFetch(`/addons/${addon.id}`, { method: "DELETE" });
        await onChanged();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete the add-on");
      }
    });
  };

  /** The plans that hand this add-on over for nothing. */
  const includedOn = (slug: string) => plans.filter((p) => (p.includedAddons || []).includes(slug)).map((p) => p.name);

  const togglePlan = (slug: string) =>
    setDraft((d) => ({
      ...d,
      planSlugs: d.planSlugs.includes(slug) ? d.planSlugs.filter((s) => s !== slug) : [...d.planSlugs, slug],
    }));

  const monthlyNum = Number(draft.monthly) || 0;
  const yearlyNum = Number(draft.yearly) || 0;
  const draftSaving = monthlyNum > 0 && yearlyNum > 0 ? Math.round((1 - yearlyNum / (monthlyNum * 12)) * 100) : 0;

  return (
    <>
      <div className="mb-4 mt-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Add-ons</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Sold beside a plan and added to the gym&apos;s bill. Switch one on for a gym under Gyms → the gym → Plan &amp; subscription.
          </p>
        </div>
        <Button variant="secondary" onClick={openNew}>
          <FiPlus className="h-4 w-4" /> New add-on
        </Button>
      </div>

      {error && (
        <Alert tone="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!addons.length ? (
        <Panel>
          <p className="text-sm text-neutral-500">Nothing sold beside the plans yet.</p>
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 min-[1700px]:grid-cols-4">
          {addons.map((addon) => (
            <Panel
              key={addon.id}
              className="flex flex-col"
              footer={
                <>
                  <span className="text-xs text-neutral-500">
                    {addon.gym_count || 0} gym{addon.gym_count === 1 ? "" : "s"} paying for it
                  </span>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(addon)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => remove(addon)} disabled={!!addon.gym_count || busy} loading={action.pending === `delete:${addon.id}`}>
                      Delete
                    </Button>
                  </div>
                </>
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">{addon.name}</h3>
                  <p className="font-mono text-xs text-neutral-400">{addon.slug}</p>
                </div>
                <div className="flex gap-1.5">
                  {!addon.isActive && <Pill tone="neutral">off</Pill>}
                  {addon.isActive && !addon.isPublic && <Pill tone="neutral">not listed</Pill>}
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-neutral-900">
                +{formatMoney(addon.price.monthly, addon.price.currency)}
                <span className="text-sm font-normal text-neutral-500"> /month</span>
              </p>
              <p className="text-xs text-neutral-500">
                {addon.price.yearly > 0 ? `${formatMoney(addon.price.yearly, addon.price.currency)} /year` : "no yearly price"}
              </p>
              {addon.description && <p className="mt-3 text-sm text-neutral-600">{addon.description}</p>}
              <p className="mt-4 text-xs text-neutral-500">
                {addon.planSlugs.length ? `Sold on: ${addon.planSlugs.join(", ")}` : "Sold on every plan"}
                {includedOn(addon.slug).length > 0 && (
                  <>
                    {" · "}
                    <span className="font-medium text-emerald-700">free on {includedOn(addon.slug).join(", ")}</span>
                  </>
                )}
              </p>
            </Panel>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.name}` : "New add-on"} size="lg">
        {formError && <Alert tone="error">{formError}</Alert>}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Member app" />
          </Field>
          <Field label="Slug">
            <Input value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} placeholder="member-app" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description" hint="Shown under the plans on the website.">
              <Textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
            </Field>
          </div>
          <Field label="Currency">
            <Select value={draft.currency} onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sort order">
            <Input type="number" value={draft.order} onChange={(e) => setDraft((d) => ({ ...d, order: e.target.value }))} />
          </Field>
          <Field label={`Monthly price (${draft.currency})`}>
            <Input type="number" value={draft.monthly} onChange={(e) => setDraft((d) => ({ ...d, monthly: e.target.value }))} />
          </Field>
          <Field label={`Yearly price (${draft.currency})`} hint={draftSaving > 0 ? `${draftSaving}% off paying monthly` : undefined}>
            <Input type="number" value={draft.yearly} onChange={(e) => setDraft((d) => ({ ...d, yearly: e.target.value }))} />
          </Field>

          <div className="md:col-span-2">
            <Field label="Plans it can go on" hint="None ticked means every plan, now and any you add later.">
              <div className="flex flex-wrap gap-2 pt-1">
                {plans.map((plan) => {
                  const on = draft.planSlugs.includes(plan.slug);
                  return (
                    <button
                      key={plan.slug}
                      type="button"
                      onClick={() => togglePlan(plan.slug)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                        on ? "border-indigo-600 bg-indigo-600 text-white" : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                      }`}
                    >
                      {plan.name}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>

          <div className="flex items-end pb-2">
            <Toggle label="Active (can be sold)" checked={draft.isActive} onChange={(v) => setDraft((d) => ({ ...d, isActive: v }))} />
          </div>
          <div className="flex items-end pb-2">
            <Toggle label="Show on the website" checked={draft.isPublic} onChange={(v) => setDraft((d) => ({ ...d, isPublic: v }))} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy || !draft.name.trim()} loading={action.pending === "save"}>
            {action.pending === "save" ? "Saving…" : "Save add-on"}
          </Button>
        </div>
      </Modal>
    </>
  );
}

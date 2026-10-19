"use client";

import { useCallback, useEffect, useState } from "react";
import { FiCheck, FiPlus } from "react-icons/fi";
import { PageHeader, Panel, Button, Field, Input, Select, Textarea, Toggle, Modal, Spinner, EmptyState, Alert, Pill, useAsyncAction } from "../_shared/ui";
import { platformFetch, formatMoney, type Addon, type Plan } from "../_shared/api";
import AddonsPanel from "./AddonsPanel";

type Draft = {
  name: string;
  slug: string;
  description: string;
  monthly: string;
  yearly: string;
  currency: string;
  maxMembers: string;
  maxStaff: string;
  maxTrainers: string;
  maxClasses: string;
  features: string;
  includedAddons: string[];
  trialDays: string;
  isActive: boolean;
  order: string;
};

/** What the platform sells in. PKR first: it is what we quote today. */
const CURRENCIES = ["PKR", "USD", "GBP", "EUR", "AED", "SAR", "INR"];

const emptyDraft: Draft = {
  name: "",
  slug: "",
  description: "",
  monthly: "0",
  yearly: "0",
  currency: "PKR",
  maxMembers: "0",
  maxStaff: "0",
  maxTrainers: "0",
  maxClasses: "0",
  features: "",
  includedAddons: [],
  trialDays: "14",
  isActive: true,
  order: "0",
};

function toDraft(plan: Plan): Draft {
  return {
    name: plan.name,
    slug: plan.slug,
    description: plan.description || "",
    monthly: String(plan.price.monthly),
    yearly: String(plan.price.yearly),
    currency: plan.price.currency,
    maxMembers: String(plan.limits.maxMembers),
    maxStaff: String(plan.limits.maxStaff),
    maxTrainers: String(plan.limits.maxTrainers),
    maxClasses: String(plan.limits.maxClasses),
    features: (plan.features || []).join("\n"),
    includedAddons: plan.includedAddons || [],
    trialDays: String(plan.trialDays),
    isActive: plan.isActive,
    order: String(plan.order),
  };
}

function limit(n: number) {
  return n ? n.toLocaleString() : "Unlimited";
}

/** What a gym saves by paying for a year up front, as a whole percent. */
function yearlySaving(plan: Plan) {
  if (!plan.price.yearly || !plan.price.monthly) return 0;
  return Math.round((1 - plan.price.yearly / (plan.price.monthly * 12)) * 100);
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  // A save that failed is said in the form, not behind it.
  const [formError, setFormError] = useState<string | null>(null);
  const action = useAsyncAction();
  const busy = action.busy;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [planList, addonList] = await Promise.all([
        platformFetch<{ data: Plan[] }>("/plans"),
        platformFetch<{ data: Addon[] }>("/addons"),
      ]);
      setPlans(planList.data);
      setAddons(addonList.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setFormError(null);
    setOpen(true);
  };
  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setDraft(toDraft(plan));
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
        limits: {
          maxMembers: Number(draft.maxMembers) || 0,
          maxStaff: Number(draft.maxStaff) || 0,
          maxTrainers: Number(draft.maxTrainers) || 0,
          maxClasses: Number(draft.maxClasses) || 0,
        },
        features: draft.features,
        includedAddons: draft.includedAddons,
        trialDays: Number(draft.trialDays) || 0,
        isActive: draft.isActive,
        order: Number(draft.order) || 0,
      };
      try {
        if (editing) await platformFetch(`/plans/${editing.id}`, { method: "PUT", body });
        else await platformFetch("/plans", { method: "POST", body });
        setOpen(false);
        await load();
      } catch (e) {
        setFormError(e instanceof Error ? e.message : "Could not save plan");
      }
    });

  const remove = (plan: Plan) => {
    if (!window.confirm(`Delete the "${plan.name}" plan?`)) return;
    action.run(`delete:${plan.id}`, async () => {
      try {
        await platformFetch(`/plans/${plan.id}`, { method: "DELETE" });
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete plan");
      }
    });
  };

  const set = (key: keyof Draft) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));
  const monthlyNum = Number(draft.monthly) || 0;
  const yearlyNum = Number(draft.yearly) || 0;
  const draftSaving = monthlyNum > 0 && yearlyNum > 0 ? Math.round((1 - yearlyNum / (monthlyNum * 12)) * 100) : 0;
  const field = (label: string, key: keyof Draft, type = "text", placeholder?: string) => (
    <Field label={label}>
      <Input type={type} value={String(draft[key])} onChange={(e) => set(key)(e.target.value)} placeholder={placeholder} />
    </Field>
  );

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Plans"
        description="What you sell to gyms: the price, the trial and the limits each tier gets. A limit of 0 means unlimited. Gyms already on a plan keep the price they agreed — changes here apply to the next gym you set up."
        actions={
          <Button onClick={openNew}>
            <FiPlus className="h-4 w-4" /> New plan
          </Button>
        }
      />

      {error && <Alert tone="error" onDismiss={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Spinner />
      ) : !plans.length ? (
        <EmptyState title="No plans yet" hint="Create the plans you sell to gyms. New gyms start on a plan's trial period." action={<Button onClick={openNew}>Create the first plan</Button>} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {plans.map((plan) => (
            <Panel
              key={plan.id}
              className="flex flex-col"
              footer={
                <>
                  <span className="text-xs text-slate-500">
                    {plan.gym_count || 0} gym{plan.gym_count === 1 ? "" : "s"} on this plan
                  </span>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(plan)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => remove(plan)} disabled={!!plan.gym_count || busy} loading={action.pending === `delete:${plan.id}`}>
                      Delete
                    </Button>
                  </div>
                </>
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{plan.name}</h2>
                  <p className="font-mono text-xs text-slate-400">{plan.slug}</p>
                </div>
                {!plan.isActive && <Pill tone="neutral">inactive</Pill>}
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                {plan.price.monthly === 0 ? "Free" : formatMoney(plan.price.monthly, plan.price.currency)}
                {plan.price.monthly > 0 && <span className="text-sm font-normal text-slate-500"> /month</span>}
              </p>
              <p className="text-xs text-slate-500">
                {plan.price.yearly > 0 ? (
                  <>
                    {formatMoney(plan.price.yearly, plan.price.currency)} /year
                    {yearlySaving(plan) > 0 && <span className="font-semibold text-emerald-600"> · saves {yearlySaving(plan)}%</span>}
                  </>
                ) : (
                  "no yearly price"
                )}
                {" · "}
                {plan.trialDays}-day trial
              </p>
              {plan.description && <p className="mt-3 text-sm text-slate-600">{plan.description}</p>}
              <dl className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["Members", plan.limits.maxMembers],
                  ["Staff", plan.limits.maxStaff],
                  ["Trainers", plan.limits.maxTrainers],
                  ["Classes", plan.limits.maxClasses],
                ].map(([label, n]) => (
                  <div key={String(label)} className="rounded-lg bg-slate-50 px-3 py-2">
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</dt>
                    <dd className="text-sm font-semibold text-slate-900">{limit(Number(n))}</dd>
                  </div>
                ))}
              </dl>
              {plan.includedAddons.length > 0 && (
                <p className="mt-4 text-xs text-slate-500">
                  Comes with:{" "}
                  <span className="font-medium text-slate-700">
                    {plan.includedAddons.map((slug) => addons.find((a) => a.slug === slug)?.name || slug).join(", ")}
                  </span>
                </p>
              )}
              {plan.features.length > 0 && (
                <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ))}
        </div>
      )}

      {/* Sold beside the plans, on top of them. */}
      {!loading && <AddonsPanel plans={plans} addons={addons} onChanged={load} />}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.name}` : "New plan"} size="lg">
        {formError && <Alert tone="error">{formError}</Alert>}
        <div className="grid gap-4 md:grid-cols-2">
          {field("Name", "name")}
          {field("Slug", "slug", "text", "starter")}
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea value={draft.description} onChange={(e) => set("description")(e.target.value)} />
            </Field>
          </div>
          <Field label="Currency">
            <Select value={draft.currency} onChange={(e) => set("currency")(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          {field("Trial days", "trialDays", "number")}
          {field(`Monthly price (${draft.currency})`, "monthly", "number")}
          <Field label={`Yearly price (${draft.currency})`} hint={draftSaving > 0 ? `${draftSaving}% off paying monthly` : undefined}>
            <Input type="number" value={draft.yearly} onChange={(e) => set("yearly")(e.target.value)} />
          </Field>
          {field("Max members (0 = unlimited)", "maxMembers", "number")}
          {field("Max staff (0 = unlimited)", "maxStaff", "number")}
          {field("Max trainers (0 = unlimited)", "maxTrainers", "number")}
          {field("Max classes (0 = unlimited)", "maxClasses", "number")}
          <div className="md:col-span-2">
            <Field label="Features (one per line)">
              <Textarea value={draft.features} onChange={(e) => set("features")(e.target.value)} />
            </Field>
          </div>
          {addons.length > 0 && (
            <div className="md:col-span-2">
              <Field label="Add-ons this plan comes with" hint="Ticked ones are free on this plan. Everything else is sold separately.">
                <div className="flex flex-wrap gap-2 pt-1">
                  {addons.map((addon) => {
                    const on = draft.includedAddons.includes(addon.slug);
                    return (
                      <button
                        key={addon.slug}
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            includedAddons: on ? d.includedAddons.filter((s) => s !== addon.slug) : [...d.includedAddons, addon.slug],
                          }))
                        }
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                          on ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {addon.name}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          )}
          {field("Sort order", "order", "number")}
          <div className="flex items-end pb-2">
            <Toggle label="Active (offered to new gyms)" checked={draft.isActive} onChange={(v) => setDraft((d) => ({ ...d, isActive: v }))} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy || !draft.name.trim()} loading={action.pending === "save"}>
            {action.pending === "save" ? "Saving…" : "Save plan"}
          </Button>
        </div>
      </Modal>
    </>
  );
}

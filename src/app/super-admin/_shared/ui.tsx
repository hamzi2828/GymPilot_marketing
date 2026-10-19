"use client";

// The platform panel's own design language: slate surfaces, an indigo accent
// (deliberately not the gym's brand colour -- this panel belongs to the
// platform, not to any gym), generous spacing, and one set of controls used
// by every page so the panel reads as one product.

import React, { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { FiInbox, FiX } from "react-icons/fi";
import BusySpinner from "@/components/BusySpinner";

// Every action button runs through these: a guard against double clicks and
// the spinner it shows meanwhile (see Button's `loading`).
export { useAsyncAction, type AsyncAction } from "@/lib/useAsyncAction";
export { BusySpinner };

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

/* ------------------------------- primitives ------------------------------ */

export function Avatar({ name, size = "md", className = "" }: { name: string; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const initials = String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";
  const sizes = { sm: "h-7 w-7 text-[11px]", md: "h-9 w-9 text-xs", lg: "h-12 w-12 text-sm", xl: "h-16 w-16 text-lg" };
  return (
    <span className={cx("inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 ring-1 ring-inset ring-indigo-200", sizes[size], className)} aria-hidden="true">
      {initials}
    </span>
  );
}

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  href?: string;
  className?: string;
  /** Its action is running: a spinner in place of the icon (or before the label), disabled and aria-busy. */
  loading?: boolean;
};

// Only an icon's size passes to the spinner that stands in for it.
const sizeOf = (className?: string) => (className || "").split(/\s+/).filter((c) => /^(h|w|size)-/.test(c)).join(" ");

function busyContent(children: React.ReactNode, size: "sm" | "md") {
  const [first, ...rest] = React.Children.toArray(children);
  // A leading icon (a component, not text) gives its place to the spinner.
  if (React.isValidElement<{ className?: string }>(first) && typeof first.type !== "string") {
    return [<BusySpinner key="busy" className={sizeOf(first.props.className) || "h-4 w-4"} />, ...rest];
  }
  return [<BusySpinner key="busy" className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />, first, ...rest];
}

export function Button({ children, onClick, type = "button", disabled, variant = "primary", size = "md", href, className = "", loading = false }: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const idleWidth = useRef(0);
  // Busy, it keeps the width it had: the spinner borrows a little of the
  // padding rather than push its neighbours along. Only a busy label too long
  // for that (Save → Saving…) makes it wider, and then just enough.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.width = "";
    if (!loading) {
      idleWidth.current = el.offsetWidth;
      return;
    }
    const style = getComputedStyle(el);
    const spare = Math.max(0, parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) - 8);
    el.style.width = `${Math.max(idleWidth.current, el.offsetWidth - spare)}px`;
  });
  const base = "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50";
  const sizes = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm" };
  const variants = {
    primary: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500",
    secondary: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900",
    danger: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  };
  const classes = cx(base, sizes[size], variants[variant], className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button ref={ref} type={type} onClick={onClick} disabled={disabled || loading} aria-busy={loading || undefined} className={classes}>
      {loading ? busyContent(children, size) : children}
    </button>
  );
}

// A field nobody may edit looks the same whether it is disabled or merely
// read-only: greyed, with a cursor that says so.
export const inputClass =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:shadow-none read-only:cursor-not-allowed read-only:bg-slate-50 read-only:text-slate-500 read-only:shadow-none";

export function Field({ label, hint, children, className = "" }: { label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </label>
  );
}

// Full width unless the caller sets a width of its own (w-72, w-40 …).
const widthOf = (className?: string) => (/(^|[ ])w-/.test(className || "") ? "" : "w-full");

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputClass, widthOf(props.className), props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputClass, widthOf(props.className), "pr-8", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputClass, widthOf(props.className), "h-auto min-h-[96px] py-2 leading-relaxed", props.className)} />;
}

/* -------------------------------- layout --------------------------------- */

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: React.ReactNode; title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-slate-300">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-slate-900">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-700">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

export function Panel({ title, description, actions, footer, children, className = "", tone = "default", padded = true }: { title?: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; footer?: React.ReactNode; children?: React.ReactNode; className?: string; tone?: "default" | "danger"; padded?: boolean }) {
  return (
    <section className={cx("overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_1px_3px_rgba(15,23,42,0.06)]", tone === "danger" ? "border-rose-200" : "border-slate-200", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div className="min-w-0">
            {title && <h2 className={cx("text-sm font-semibold", tone === "danger" ? "text-rose-700" : "text-slate-900")}>{title}</h2>}
            {description && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={padded ? "px-6 py-5" : ""}>{children}</div>
      {footer && <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-3">{footer}</footer>}
    </section>
  );
}

export function StatCard({ label, value, hint, icon, tone = "default" }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ReactNode; tone?: "default" | "good" | "warn" | "bad" | "accent" }) {
  const tiles = {
    default: "bg-slate-100 text-slate-600",
    good: "bg-emerald-50 text-emerald-600",
    warn: "bg-amber-50 text-amber-600",
    bad: "bg-rose-50 text-rose-600",
    accent: "bg-indigo-50 text-indigo-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {icon && <span className={cx("inline-flex h-9 w-9 items-center justify-center rounded-lg", tiles[tone])}>{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function KeyValue({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{item.label}</dt>
          <dd className="mt-1 truncate text-sm text-slate-800">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const PILL: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  trialing: "bg-sky-50 text-sky-700 ring-sky-600/20",
  past_due: "bg-amber-50 text-amber-700 ring-amber-600/20",
  expired: "bg-rose-50 text-rose-700 ring-rose-600/20",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
  suspended: "bg-rose-50 text-rose-700 ring-rose-600/20",
  primary: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/20",
  good: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warn: "bg-amber-50 text-amber-700 ring-amber-600/20",
  bad: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export function Pill({ tone = "neutral", children, dot = true }: { tone?: string; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset", PILL[tone] || PILL.neutral)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  return <Pill tone={status}>{String(status).replace("_", " ")}</Pill>;
}

export function Alert({ tone = "info", children, onDismiss }: { tone?: "info" | "success" | "error" | "warning"; children: React.ReactNode; onDismiss?: () => void }) {
  const tones = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-rose-200 bg-rose-50 text-rose-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  };
  return (
    <div className={cx("mb-5 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm", tones[tone])} role="status">
      <span className="min-w-0">{children}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="shrink-0 text-xs font-semibold uppercase tracking-wide opacity-70 hover:opacity-100">
          Dismiss
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint, action, icon }: { title: string; hint?: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">{icon || <FiInbox className="h-5 w-5" />}</span>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-slate-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-56 flex-col items-center justify-center gap-3 text-xs text-slate-400" role="status" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      {label}
    </div>
  );
}

export function Toolbar({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

export function DataTable({ columns, rows, empty, onRowClick }: { columns: (string | { label: string; align?: "left" | "right" })[]; rows: React.ReactNode[][]; empty?: React.ReactNode; onRowClick?: (index: number) => void }) {
  if (!rows.length) {
    return typeof empty === "string" || !empty ? <EmptyState title={(empty as string) || "Nothing here yet"} /> : <>{empty}</>;
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {columns.map((c, i) => {
                const col = typeof c === "string" ? { label: c, align: "left" as const } : c;
                return (
                  <th key={i} className={cx("whitespace-nowrap px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500", col.align === "right" ? "text-right" : "text-left")}>
                    {col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} onClick={onRowClick ? () => onRowClick(ri) : undefined} className={cx("border-b border-slate-100 last:border-b-0 transition-colors", onRowClick ? "cursor-pointer hover:bg-indigo-50/40" : "hover:bg-slate-50/60")}>
                {row.map((cell, ci) => {
                  const col = columns[ci];
                  const align = typeof col === "string" ? "left" : col.align;
                  return (
                    <td key={ci} className={cx("px-5 py-3.5 align-middle text-slate-700", align === "right" ? "text-right" : "")}>
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SegmentBar({ segments }: { segments: { label: string; value: number; className: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => <div key={s.label} className={cx("h-full", s.className)} style={{ width: `${(s.value / total) * 100}%` }} title={`${s.label}: ${s.value}`} />)}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span className={cx("h-2 w-2 rounded-full", s.className)} /> {s.label} <span className="font-semibold text-slate-900">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function relativeTime(value?: string | null): string {
  if (!value) return "—";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const abs = Math.abs(diff);
  const minutes = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  const text = minutes < 1 ? "just now" : minutes < 60 ? `${minutes} min` : hours < 24 ? `${hours} h` : days < 30 ? `${days} d` : new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  if (minutes < 1 || days >= 30) return text;
  return diff >= 0 ? `${text} ago` : `in ${text}`;
}

/* ------------------------------- overlays -------------------------------- */

export function Modal({ open, onClose, title, children, size = "md" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: "sm" | "md" | "lg" | "xl" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);
  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} aria-hidden="true" />
      <div className={cx("admin-scroll relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl", widths[size])}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <FiX className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint, disabled = false }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string; disabled?: boolean }) {
  return (
    <label className={cx("flex items-start gap-3", disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={cx("relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:cursor-not-allowed", checked ? "bg-indigo-600" : "bg-slate-300")}>
        <span className={cx("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

export function formatLastLogin(value?: string | null): string {
  return value ? new Date(value).toLocaleString() : "never";
}

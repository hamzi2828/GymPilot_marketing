"use client";

// The sign-in, forgot and reset pages share this split screen: the product
// on the left, the form on the right. Its links back to the site load the
// site as a page of its own, with its own policy and analytics, not inside
// the panel's (FullPageLink).

import { FiArrowLeft } from "react-icons/fi";
import FullPageLink from "@/components/FullPageLink";
import { BusySpinner, cx } from "./ui";
import Glow from "@/components/marketing/Glow";

const POINTS = ["Every gym in its own database", "Plans, trials and renewals in one place", "Domains verified and served automatically"];

export default function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="bg-grid-dark absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_70%)]" aria-hidden="true" />
        <Glow className="-left-40 top-1/3 h-[720px] w-[720px]" color="rgba(79,70,229,0.35)" />
        <Glow className="right-0 top-0 h-[520px] w-[520px] translate-x-1/3" color="rgba(217,70,239,0.22)" />
        <div className="relative">
          <FullPageLink href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white">
            <FiArrowLeft className="h-3.5 w-3.5" /> Back to the site
          </FullPageLink>
        </div>
        <div className="relative">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
              <path d="M3 10h2v4H3v-4Zm16 0h2v4h-2v-4ZM6 8h2v8H6V8Zm10 0h2v8h-2V8Zm-7 3h6v2H9v-2Z" />
            </svg>
          </span>
          <h2 className="mt-8 font-display text-4xl font-bold leading-tight tracking-tight">
            GymsPilotPro
            <br />
            <span className="text-gradient">Platform panel</span>
          </h2>
          <ul className="mt-8 space-y-2.5 text-sm text-slate-300">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">Restricted to platform administrators. Every action here is recorded in the audit log.</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <FullPageLink href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M3 10h2v4H3v-4Zm16 0h2v4h-2v-4ZM6 8h2v8H6V8Zm10 0h2v8h-2V8Zm-7 3h6v2H9v-2Z" />
              </svg>
            </span>
            <span className="font-display text-lg font-bold text-slate-900">GymsPilotPro</span>
          </FullPageLink>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">{footer}</div>}
        </div>
      </section>
    </main>
  );
}

export const authInput = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

/** `loading`: its request is running -- a spinner before the label, disabled and aria-busy. Full width, so nothing moves. */
export function AuthButton({ children, disabled, loading = false, type = "submit", className = "" }: { children: React.ReactNode; disabled?: boolean; loading?: boolean; type?: "submit" | "button"; className?: string }) {
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={cx("inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50", className)}>
      {loading && <BusySpinner />}
      {children}
    </button>
  );
}

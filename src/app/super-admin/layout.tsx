"use client";

// The platform panel: every gym on GymsPilotPro, their plans and their numbers.
// It has its own session (see _shared/api.ts) and its own shell; the
// marketing site around it is a plain public page.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiCheckSquare, FiCreditCard, FiExternalLink, FiGrid, FiHome, FiInbox, FiLayers, FiList, FiLogOut, FiMenu, FiPlus, FiUser, FiX } from "react-icons/fi";
import { PAYMENT_REQUESTS_CHANGED, clearPlatformToken, getPlatformToken, platformFetch, type Overview, type PlatformAdmin } from "./_shared/api";
import { Avatar, BusySpinner, cx, useAsyncAction } from "./_shared/ui";
import FullPageLink from "@/components/FullPageLink";

type NavItem = { name: string; path: string; icon: React.ReactNode; exact?: boolean; badge?: number };

function Brand() {
  return (
    <Link href="/super-admin" className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M3 10h2v4H3v-4Zm16 0h2v4h-2v-4ZM6 8h2v8H6V8Zm10 0h2v8h-2V8Zm-7 3h6v2H9v-2Z" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-white">GymsPilotPro</span>
        <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Platform</span>
      </span>
    </Link>
  );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const [newRequests, setNewRequests] = useState(0);
  const [toVerify, setToVerify] = useState(0);
  const signingOut = useAsyncAction();

  useEffect(() => {
    if (!getPlatformToken()) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    platformFetch<{ admin: PlatformAdmin }>("/auth/me")
      .then((res) => {
        if (!cancelled) setAdmin(res.admin);
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  // The sidebar's counts (unread demo requests, payments to verify);
  // refreshed on navigation and when Payments to verify approves or rejects.
  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    const refresh = () =>
      platformFetch<{ data: Overview }>("/overview")
        .then((res) => {
          if (cancelled) return;
          setNewRequests(res.data.demo_requests_new || 0);
          setToVerify(res.data.pending_count || 0);
        })
        .catch(() => {});
    refresh();
    window.addEventListener(PAYMENT_REQUESTS_CHANGED, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(PAYMENT_REQUESTS_CHANGED, refresh);
    };
  }, [admin, pathname]);

  // A route change closes the mobile drawer.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!checked || !admin) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  // Ends the session on the server as well, so a copy of the token stops
  // working. If the API cannot be reached, this browser is signed out anyway.
  // Busy until the sign-in page has replaced the panel.
  const signOut = () =>
    signingOut.run("sign-out", async (leave) => {
      await platformFetch("/auth/logout", { method: "POST" }).catch(() => {});
      clearPlatformToken();
      leave();
      router.replace("/login");
    });

  const groups: { heading: string; items: NavItem[] }[] = [
    {
      heading: "Manage",
      items: [
        { name: "Overview", path: "/super-admin", icon: <FiHome className="h-[18px] w-[18px]" />, exact: true },
        { name: "Gyms", path: "/super-admin/gyms", icon: <FiGrid className="h-[18px] w-[18px]" /> },
        { name: "Plans", path: "/super-admin/plans", icon: <FiLayers className="h-[18px] w-[18px]" /> },
        { name: "Payments to verify", path: "/super-admin/payment-requests", icon: <FiCheckSquare className="h-[18px] w-[18px]" />, badge: toVerify },
        { name: "Demo requests", path: "/super-admin/demo-requests", icon: <FiInbox className="h-[18px] w-[18px]" />, badge: newRequests },
      ],
    },
    {
      heading: "System",
      items: [
        { name: "Payments", path: "/super-admin/payments", icon: <FiCreditCard className="h-[18px] w-[18px]" /> },
        { name: "Audit log", path: "/super-admin/audit", icon: <FiList className="h-[18px] w-[18px]" /> },
        { name: "My account", path: "/super-admin/account", icon: <FiUser className="h-[18px] w-[18px]" /> },
      ],
    },
  ];

  const nav = (
    <nav className="flex-1 space-y-6 px-3 py-5">
      {groups.map((group) => (
        <div key={group.heading}>
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{group.heading}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.exact ? pathname === item.path : pathname === item.path || pathname.startsWith(item.path + "/");
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  aria-current={active ? "page" : undefined}
                  className={cx("group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors", active ? "bg-white/10 font-medium text-white" : "text-slate-400 hover:bg-white/5 hover:text-white")}
                >
                  <span className={cx("absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-400 transition-opacity", active ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                  <span className={active ? "text-indigo-300" : "text-slate-500 group-hover:text-slate-300"}>{item.icon}</span>
                  <span className="flex-1">{item.name}</span>
                  {!!item.badge && <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{item.badge}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <div>
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Site</p>
        <FullPageLink href="/" className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white">
          <FiExternalLink className="h-[18px] w-[18px] text-slate-500 group-hover:text-slate-300" /> Marketing site
        </FullPageLink>
      </div>
    </nav>
  );

  const user = (
    <div className="border-t border-white/10 p-4">
      <div className="flex items-center gap-3">
        <Avatar name={admin.name || admin.email} size="md" className="bg-indigo-500/20 text-indigo-200 ring-indigo-400/30" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{admin.name || "Super admin"}</p>
          <p className="break-all text-[11px] leading-snug text-slate-400">{admin.email}</p>
        </div>
      </div>
      <button type="button" onClick={signOut} disabled={signingOut.busy} aria-busy={signingOut.busy || undefined} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
        {signingOut.busy ? <BusySpinner className="h-3.5 w-3.5" /> : <FiLogOut className="h-3.5 w-3.5" />} Sign out
      </button>
    </div>
  );

  return (
    <div className="admin-scroll flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-slate-950 lg:flex">
        <div className="px-5 py-5">
          <Brand />
        </div>
        {nav}
        {user}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-5">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {user}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
            <FiMenu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-slate-900">Platform panel</span>
          <Link href="/super-admin/gyms/new" aria-label="New gym" className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50">
            <FiPlus className="h-5 w-5" />
          </Link>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1400px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

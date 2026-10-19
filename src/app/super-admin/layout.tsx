"use client";

// The platform panel: every gym on GymsPilotPro, their plans and their numbers.
// It has its own session (see _shared/api.ts) and its own shell; the
// marketing site around it is a plain public page.
//
// The shell is the gym admin's (GymPilot_frontend admin/layout.tsx,
// components/admin/AdminSidebar.tsx and AdminHeader.tsx): a light sidebar
// with the brand on top and the pages in small headed groups, a top bar with
// who is signed in and Sign out, and below lg the sidebar as a drawer opened
// from the bar. The page itself takes all the width beside the sidebar.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiCheckSquare, FiCreditCard, FiExternalLink, FiGrid, FiHome, FiInbox, FiLayers, FiList, FiLogOut, FiMenu, FiPlus, FiUser, FiX } from "react-icons/fi";
import { PAYMENT_REQUESTS_CHANGED, clearPlatformToken, getPlatformToken, platformFetch, type Overview, type PlatformAdmin } from "./_shared/api";
import { ACCENT, BusySpinner, cx, useAsyncAction } from "./_shared/ui";
import FullPageLink from "@/components/FullPageLink";

type NavItem = { name: string; path: string; icon: React.ReactNode; exact?: boolean; badge?: number };

const iconCls = "h-[18px] w-[18px]";

function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={cx("flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-sm shadow-indigo-500/30", className)} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
        <path d="M3 10h2v4H3v-4Zm16 0h2v4h-2v-4ZM6 8h2v8H6V8Zm10 0h2v8h-2V8Zm-7 3h6v2H9v-2Z" />
      </svg>
    </span>
  );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [checked, setChecked] = useState(false);
  // Closed to start with: below lg the sidebar is a drawer over the page.
  // From lg up it is always shown, whatever this says.
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

  // Escape closes the drawer too.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!checked || !admin) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-indigo-600" />
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
        { name: "Overview", path: "/super-admin", icon: <FiHome className={iconCls} />, exact: true },
        { name: "Gyms", path: "/super-admin/gyms", icon: <FiGrid className={iconCls} /> },
        { name: "Plans", path: "/super-admin/plans", icon: <FiLayers className={iconCls} /> },
        { name: "Payments to verify", path: "/super-admin/payment-requests", icon: <FiCheckSquare className={iconCls} />, badge: toVerify },
        { name: "Demo requests", path: "/super-admin/demo-requests", icon: <FiInbox className={iconCls} />, badge: newRequests },
      ],
    },
    {
      heading: "System",
      items: [
        { name: "Payments", path: "/super-admin/payments", icon: <FiCreditCard className={iconCls} /> },
        { name: "Audit log", path: "/super-admin/audit", icon: <FiList className={iconCls} /> },
        { name: "My account", path: "/super-admin/account", icon: <FiUser className={iconCls} /> },
      ],
    },
  ];

  const displayName = admin.name || admin.email;
  const initial = (displayName || "?").trim().charAt(0).toUpperCase() || "?";
  const itemCls = "group relative flex items-center gap-3 rounded-lg py-2 pl-3 pr-3 text-sm transition-colors";

  return (
    <div className="admin-scroll flex min-h-screen bg-white text-neutral-900">
      {/* Scrim behind the drawer while it is open, so a tap outside closes it. */}
      {open && <div className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-[1px] lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside
        id="panel-sidebar"
        className={cx(
          "admin-scroll fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-y-auto border-r border-neutral-200 bg-white transition-[transform,visibility] duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 lg:visible",
          open ? "translate-x-0 shadow-2xl lg:shadow-none" : "invisible -translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-neutral-200 px-5">
          <Link href="/super-admin" className="flex min-w-0 flex-1 items-center gap-3">
            <Logo />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold tracking-tight text-neutral-900">GymsPilotPro</span>
              <span className="block truncate text-[11px] text-neutral-400">Platform</span>
            </span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 lg:hidden">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5" aria-label="Platform panel">
          {groups.map((group, idx) => (
            <div key={group.heading} className={idx > 0 ? "mt-7" : ""}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400">{group.heading}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.exact ? pathname === item.path : pathname === item.path || pathname.startsWith(item.path + "/");
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      aria-current={active ? "page" : undefined}
                      className={cx(itemCls, active ? "bg-neutral-100 font-semibold text-neutral-900" : "font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900")}
                    >
                      {/* The accent rail marks the active row without flooding it in colour. */}
                      <span aria-hidden="true" className={cx("absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-500 transition-opacity", active ? "opacity-100" : "opacity-0")} />
                      <span className={active ? "text-indigo-600" : "text-neutral-400 transition-colors group-hover:text-neutral-600"}>{item.icon}</span>
                      <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      {!!item.badge && (
                        <span className={cx("min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white", ACCENT)} aria-label={`${item.badge} waiting`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="mt-7">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400">Site</p>
            <FullPageLink href="/" className={cx(itemCls, "font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900")}>
              <FiExternalLink className={cx(iconCls, "text-neutral-400 transition-colors group-hover:text-neutral-600")} />
              <span className="truncate">Marketing site</span>
            </FullPageLink>
          </div>
        </nav>

        <div className="shrink-0 border-t border-neutral-200 px-5 py-4">
          <p className="text-[10px] text-neutral-400">© {new Date().getFullYear()} GymsPilotPro</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="panel-sidebar"
              className="-ml-1.5 rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 lg:hidden"
            >
              {open ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
            </button>
            <Link href="/super-admin" className="flex min-w-0 items-center gap-2 lg:hidden">
              <Logo className="h-7 w-7" />
              <span className="hidden truncate text-sm font-semibold text-neutral-900 min-[360px]:block">GymsPilotPro</span>
            </Link>
            <p className="hidden text-sm text-neutral-500 lg:block">
              Platform panel <span className="text-neutral-300">·</span> <span className="text-neutral-400">every gym on GymsPilotPro</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/super-admin/gyms/new"
              aria-label="New gym"
              title="New gym"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 px-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 lg:hidden"
            >
              <FiPlus className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="hidden flex-col items-end leading-tight sm:flex">
                <span className="max-w-[220px] truncate text-xs font-medium text-neutral-900">{displayName}</span>
                <span className="max-w-[220px] truncate text-[11px] text-neutral-500">{admin.name ? admin.email : "Super admin"}</span>
              </div>
              <Link
                href="/super-admin/account"
                title="My account"
                aria-label="My account"
                className={cx("flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ring-[3px] ring-indigo-500/20", ACCENT)}
              >
                {initial}
              </Link>
            </div>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut.busy}
              aria-busy={signingOut.busy || undefined}
              aria-label="Sign out"
              title="Sign out"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-wait"
            >
              {signingOut.busy ? <BusySpinner className="h-4 w-4" /> : <FiLogOut className="h-4 w-4" aria-hidden="true" />}
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* All the width beside the sidebar; the pages lay themselves out in
            columns on a wide screen rather than one long one. */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiZap } from "react-icons/fi";
import { platformFetch, setPlatformToken } from "@/app/super-admin/_shared/api";
import AuthShell, { AuthButton, authInput } from "@/app/super-admin/_shared/AuthShell";
import { useAsyncAction } from "@/app/super-admin/_shared/ui";
import FullPageLink from "@/components/FullPageLink";

// One-tap sign-in for the super admin account during local development.
// Nothing is inlined into the page: arriving with ?quick=1 asks the app's own
// /api/dev-login route, which only answers under `next dev` and reads the
// account from non-public environment variables (see .env.example).
type QuickAccount = { email: string; password: string };

/** A 6-digit code, or -- on an app sign-in -- a 10-character backup code. */
function codeReady(code: string, method: "email" | "app"): boolean {
  if (/^\d{6}$/.test(code.replace(/\s/g, ""))) return true;
  if (method === "email") return code.replace(/\D/g, "").length === 6;
  return /^[a-z0-9]{10}$/i.test(code.replace(/[\s-]/g, ""));
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<{ challengeId: string; message: string; method: "email" | "app" } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { busy, run } = useAsyncAction();
  const [quick, setQuick] = useState<QuickAccount | null>(null);
  // Sent here by the reset page once the new password is saved.
  const passwordReset = params.get("reset") === "1";

  // Arriving with ?quick=1 pre-fills the account, when the dev route has one.
  useEffect(() => {
    if (params.get("quick") !== "1") return;
    let cancelled = false;
    fetch("/api/dev-login", { cache: "no-store" })
      .then(async (res) => (res.ok ? ((await res.json()) as QuickAccount) : null))
      .then((account) => {
        if (cancelled || !account || !account.email || !account.password) return;
        setQuick(account);
        setEmail(account.email);
        setPassword(account.password);
      })
      .catch(() => {
        /* not in development, or nothing configured: the form is just a form */
      });
    return () => {
      cancelled = true;
    };
  }, [params]);

  const finish = (token: string) => {
    setPlatformToken(token);
    router.replace("/super-admin");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Signed in, the button stays busy until the panel has replaced this page.
    run("sign-in", async (leave) => {
      setError(null);
      try {
        if (challenge) {
          // An app sign-in also takes a backup code (letters and a dash), so only an emailed code is cut to digits.
          const sent = challenge.method === "app" ? code.trim() : code.replace(/\D/g, "");
          const res = await platformFetch<{ token: string }>("/auth/login/2fa", { method: "POST", body: { challengeId: challenge.challengeId, code: sent } });
          leave();
          finish(res.token);
          return;
        }
        const res = await platformFetch<{ token?: string; requires2fa?: boolean; method?: "email" | "app"; challengeId?: string; message?: string }>("/auth/login", { method: "POST", body: { email, password } });
        if (res.requires2fa && res.challengeId) {
          const method = res.method === "app" ? "app" : "email";
          setChallenge({
            challengeId: res.challengeId,
            method,
            message: res.message || (method === "app" ? "Enter the code from your authenticator app." : "Enter the code we emailed you."),
          });
          setPassword("");
          return;
        }
        if (res.token) {
          leave();
          finish(res.token);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign in failed");
      }
    });
  };

  return (
    <AuthShell
      title={challenge ? (challenge.method === "app" ? "Enter your code" : "Check your email") : "Sign in"}
      subtitle={challenge ? challenge.message : "Platform administrators only."}
      footer={
        challenge ? (
          <button
            type="button"
            onClick={() => {
              setChallenge(null);
              setCode("");
              setError(null);
            }}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to sign in
          </button>
        ) : (
          <>
            <Link href="/forgot" className="font-medium text-indigo-600 hover:text-indigo-500">
              Forgot password?
            </Link>
            <FullPageLink href="/" className="hover:text-neutral-800">
              Back to the website
            </FullPageLink>
          </>
        )
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {challenge && challenge.method === "app" ? (
          <label className="block">
            <span className="text-xs font-semibold text-neutral-700">Code from your authenticator app</span>
            <input autoFocus autoComplete="one-time-code" autoCapitalize="none" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} className={`${authInput} mt-1.5 text-center text-xl tracking-[0.3em]`} placeholder="123456" />
            <span className="mt-1.5 block text-[11px] text-neutral-500">Lost your phone? Type one of your backup codes (like abcde-fghjk) instead.</span>
          </label>
        ) : challenge ? (
          <label className="block">
            <span className="text-xs font-semibold text-neutral-700">6-digit code</span>
            <input autoFocus inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} className={`${authInput} mt-1.5 text-center text-2xl tracking-[0.4em]`} placeholder="••••••" />
          </label>
        ) : (
          <>
            {passwordReset && !error && (
              <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                Password updated. Sign in with your new password.
              </p>
            )}
            <label className="block">
              <span className="text-xs font-semibold text-neutral-700">Email</span>
              <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={`${authInput} mt-1.5`} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-neutral-700">Password</span>
              <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${authInput} mt-1.5`} />
            </label>
            {quick && (
              <button
                type="button"
                onClick={() => {
                  setEmail(quick.email);
                  setPassword(quick.password);
                  setError(null);
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/60 px-3.5 py-2.5 text-left transition-colors hover:border-indigo-400 hover:bg-indigo-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <FiZap className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-neutral-900">Super admin · quick sign in (development)</span>
                  <span className="block truncate text-[11px] text-neutral-500">{quick.email} · tap to fill, then Sign in</span>
                </span>
              </button>
            )}
          </>
        )}

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

        <AuthButton loading={busy} disabled={challenge ? !codeReady(code, challenge.method) : false}>
          {busy ? "Please wait…" : challenge ? "Verify" : "Sign in"}
        </AuthButton>
      </form>
    </AuthShell>
  );
}

export default function SuperAdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { platformFetch, PlatformApiError } from "@/app/super-admin/_shared/api";
import AuthShell, { AuthButton, authInput } from "@/app/super-admin/_shared/AuthShell";
import { useAsyncAction } from "@/app/super-admin/_shared/ui";

// The API answers EMAIL_NOT_CONFIGURED when it has no way to send email: no
// link would ever arrive, so the page says so rather than promise one.
const NO_EMAIL = "Password reset by email isn't available yet — contact support.";

export default function SuperAdminForgotPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { busy, run } = useAsyncAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run("send", async () => {
      setError(null);
      try {
        const res = await platformFetch<{ message: string }>("/auth/forgot-password", { method: "POST", body: { email } });
        setDone(res.message);
      } catch (err) {
        if (err instanceof PlatformApiError && err.code === "EMAIL_NOT_CONFIGURED") setError(NO_EMAIL);
        else setError(err instanceof Error ? err.message : "Request failed");
      }
    });
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email address you sign in with."
      footer={
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Back to sign in
        </Link>
      }
    >
      {done ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{done}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-neutral-700">Email</span>
            <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={`${authInput} mt-1.5`} />
          </label>
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
          <AuthButton loading={busy}>{busy ? "Sending…" : "Request a reset link"}</AuthButton>
        </form>
      )}
    </AuthShell>
  );
}

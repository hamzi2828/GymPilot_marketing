"use client";

import { useState } from "react";
import Link from "next/link";
import { platformFetch } from "@/app/super-admin/_shared/api";
import AuthShell, { AuthButton, authInput } from "@/app/super-admin/_shared/AuthShell";
import { useAsyncAction } from "@/app/super-admin/_shared/ui";

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
        setError(err instanceof Error ? err.message : "Request failed");
      }
    });
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will email you a link that works for one hour."
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
            <span className="text-xs font-semibold text-slate-700">Email</span>
            <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={`${authInput} mt-1.5`} />
          </label>
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
          <AuthButton loading={busy}>{busy ? "Sending…" : "Send reset link"}</AuthButton>
        </form>
      )}
    </AuthShell>
  );
}

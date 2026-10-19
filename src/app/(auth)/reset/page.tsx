"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { platformFetch } from "@/app/super-admin/_shared/api";
import AuthShell, { AuthButton, authInput } from "@/app/super-admin/_shared/AuthShell";
import { useAsyncAction } from "@/app/super-admin/_shared/ui";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { busy, run } = useAsyncAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("The passwords do not match");
      return;
    }
    run("save", async (leave) => {
      setError(null);
      try {
        await platformFetch("/auth/reset-password", { method: "POST", body: { email, token, password } });
        // Busy until the sign-in page has taken over; it says the password changed.
        leave();
        router.replace("/login?reset=1");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not reset the password");
      }
    });
  };

  return (
    <AuthShell
      title="Choose a new password"
      subtitle={email}
      footer={
        <Link href="/forgot" className="font-medium text-indigo-600 hover:text-indigo-500">
          Request a new link
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {!token && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">This link is missing its token. Request a new one.</p>}
        <label className="block">
          <span className="text-xs font-semibold text-neutral-700">New password (min 10 characters)</span>
          <input type="password" required minLength={10} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${authInput} mt-1.5`} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-neutral-700">Confirm</span>
          <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${authInput} mt-1.5`} />
        </label>
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
        <AuthButton loading={busy} disabled={!token}>
          {busy ? "Saving…" : "Set password"}
        </AuthButton>
      </form>
    </AuthShell>
  );
}

export default function SuperAdminResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}

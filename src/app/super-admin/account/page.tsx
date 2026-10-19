"use client";

import { useEffect, useState } from "react";
import { FiShield, FiKey, FiSmartphone, FiMail, FiCopy } from "react-icons/fi";
import { PageHeader, Panel, Button, Field, Input, Alert, Avatar, Pill, formatLastLogin, useAsyncAction, type AsyncAction } from "../_shared/ui";
import { platformFetch, PlatformApiError, setPlatformToken, type PlatformAdmin } from "../_shared/api";
import QrCode from "./QrCode";

/** What setting up the authenticator app hands back: shown until a code confirms it. */
type AppSetup = { secret: string; otpauth_url: string; account: string; issuer: string };

/** A change to two-factor sign-in that asks for the password first. */
type NeedsPassword = "app-setup" | "email-off";

/** The API turned the password down (none typed, or not the right one): said under the field, not at the top. */
const passwordRefusal = (e: unknown): string | null =>
  e instanceof PlatformApiError && !!e.code && (e.code.startsWith("PASSWORD_") || e.code === "WRONG_PASSWORD") ? e.message || "That password is not right." : null;

export default function SuperAdminAccountPage() {
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  // Two forms, each one action at a time: two-factor sign-in, and the password.
  const twoFactor = useAsyncAction();
  const passwordChange = useAsyncAction();
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  // Authenticator app: the setup in progress, the codes shown once after it,
  // and the turn-off form.
  const [setup, setSetup] = useState<AppSetup | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [offPassword, setOffPassword] = useState("");
  const [offCode, setOffCode] = useState("");
  // Turning emailed codes off, and setting up (or switching to) the app, ask
  // for the password first: a stolen session must not be able to change the
  // step that guards the next sign-in. `setupPassword` is the one confirmed
  // for the app's setup, sent again with its first code.
  const [confirm, setConfirm] = useState<NeedsPassword | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const method = admin?.two_factor ? (admin.two_factor_method === "app" ? "app" : "email") : null;

  const askPassword = (change: NeedsPassword | null) => {
    setConfirm(change);
    setConfirmPassword("");
    setPasswordError(null);
  };
  const cancelSetup = () => {
    setSetup(null);
    setSetupCode("");
    setSetupPassword("");
    setPasswordError(null);
  };

  const load = () => platformFetch<{ admin: PlatformAdmin }>("/auth/me").then((r) => setAdmin(r.admin));
  useEffect(() => {
    load().catch(() => setAdmin(null));
  }, []);

  // In the two-factor forms a refusal of the password is said under its
  // field; anything else at the top.
  const run = (form: AsyncAction, key: string, fn: () => Promise<string>) =>
    form.run(key, async () => {
      setNotice(null);
      if (form === twoFactor) setPasswordError(null);
      try {
        setNotice({ tone: "success", text: await fn() });
        await load();
      } catch (e) {
        const refused = form === twoFactor ? passwordRefusal(e) : null;
        if (refused) setPasswordError(refused);
        else setNotice({ tone: "error", text: e instanceof Error ? e.message : "Request failed" });
      }
    });

  const passwordProblem = passwordError && (
    <p role="alert" className="-mt-2 text-xs text-rose-600">
      {passwordError}
    </p>
  );

  return (
    <>
      <PageHeader eyebrow="System" title="My account" description="Your platform sign-in: two-factor and password." />
      {notice && <Alert tone={notice.tone} onDismiss={() => setNotice(null)}>{notice.text}</Alert>}

      <Panel className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={admin?.name || admin?.email || "?"} size="xl" />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-neutral-900">{admin?.name || "Super admin"}</p>
            <p className="text-sm text-neutral-500">{admin?.email}</p>
          </div>
          <div className="text-right text-xs text-neutral-500">
            <Pill tone={admin?.two_factor ? "good" : "neutral"}>{method === "app" ? "2FA on · app" : method === "email" ? "2FA on · email" : "2FA off"}</Pill>
            <p className="mt-1">Last sign-in {formatLastLogin(admin?.last_login)}</p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title={
            <span className="flex items-center gap-2">
              <FiShield className="h-4 w-4 text-neutral-400" /> Two-factor sign-in
            </span>
          }
          description={
            method === "app"
              ? `On — a code from your authenticator app at every sign-in. ${admin?.backup_codes_left ?? 0} backup code(s) left.`
              : method === "email"
                ? "On — a 6-digit code is emailed to you at every sign-in."
                : "Off — add a second step to every sign-in: a code from an authenticator app on your phone, or one emailed to you."
          }
        >
          {backupCodes ? (
            <div className="space-y-3">
              <Alert tone="warning">
                Save these backup codes somewhere safe (a password manager, or printed). Each one signs you in once if you lose your phone. They will not be shown again.
              </Alert>
              <ul className="grid grid-cols-2 gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-sm text-neutral-900">
                {backupCodes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard?.writeText(backupCodes.join("\n")).then(
                      () => setNotice({ tone: "success", text: "Backup codes copied." }),
                      () => setNotice({ tone: "error", text: "Could not copy — select and copy them by hand." })
                    );
                  }}
                >
                  <FiCopy className="h-4 w-4" /> Copy
                </Button>
                <Button onClick={() => setBackupCodes(null)}>I have saved them</Button>
              </div>
            </div>
          ) : setup ? (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">
                Scan this with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Authy…), then type the 6-digit code it shows.
              </p>
              <div className="flex flex-wrap items-start gap-4">
                <QrCode value={setup.otpauth_url} label="QR code for your authenticator app" />
                <div className="min-w-0 flex-1 space-y-1 text-xs text-neutral-500">
                  <p>Can&apos;t scan? Enter this key in the app instead (time-based):</p>
                  <p className="break-all rounded-lg bg-neutral-50 px-2 py-1.5 font-mono text-sm text-neutral-900">{setup.secret.replace(/(.{4})/g, "$1 ").trim()}</p>
                  <p>Account: {setup.account}</p>
                </div>
              </div>
              <Field label="Code from the app">
                <Input inputMode="numeric" autoComplete="one-time-code" value={setupCode} onChange={(e) => setSetupCode(e.target.value)} placeholder="123456" />
              </Field>
              {/* Only when the password confirmed before the QR code was turned down now. */}
              {passwordError && (
                <>
                  <Field label="Your password">
                    <Input type="password" autoComplete="current-password" value={setupPassword} onChange={(e) => setSetupPassword(e.target.value)} aria-invalid />
                  </Field>
                  {passwordProblem}
                </>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={cancelSetup}>
                  Cancel
                </Button>
                <Button
                  disabled={twoFactor.busy || setupCode.replace(/\D/g, "").length !== 6 || (!!passwordError && !setupPassword)}
                  loading={twoFactor.pending === "app-on"}
                  onClick={() =>
                    run(twoFactor, "app-on", async () => {
                      const r = await platformFetch<{ backup_codes: string[] }>("/auth/two-factor/app/enable", {
                        method: "POST",
                        body: { code: setupCode.replace(/\D/g, ""), currentPassword: setupPassword },
                      });
                      cancelSetup();
                      setBackupCodes(r.backup_codes);
                      return "Authenticator app is on. You will be asked for a code from it at every sign-in.";
                    })
                  }
                >
                  Turn on
                </Button>
              </div>
            </div>
          ) : method === "app" ? (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">To turn it off, confirm your password and a current code from the app (or a backup code).</p>
              <Field label="Password">
                <Input type="password" autoComplete="current-password" value={offPassword} onChange={(e) => setOffPassword(e.target.value)} aria-invalid={!!passwordError || undefined} />
              </Field>
              {passwordProblem}
              <Field label="Code from the app, or a backup code">
                <Input autoComplete="one-time-code" autoCapitalize="none" spellCheck={false} value={offCode} onChange={(e) => setOffCode(e.target.value)} placeholder="123456" />
              </Field>
              <div className="flex justify-end">
                <Button
                  variant="danger"
                  disabled={twoFactor.busy || !offPassword || !offCode.trim()}
                  loading={twoFactor.pending === "app-off"}
                  onClick={() =>
                    run(twoFactor, "app-off", async () => {
                      await platformFetch("/auth/two-factor/app/disable", { method: "POST", body: { password: offPassword, code: offCode.trim() } });
                      setOffPassword("");
                      setOffCode("");
                      return "Two-factor sign-in is off.";
                    })
                  }
                >
                  Turn off
                </Button>
              </div>
            </div>
          ) : confirm ? (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">
                {confirm === "app-setup"
                  ? `Confirm your password to ${method === "email" ? "switch to" : "set up"} an authenticator app.`
                  : "Confirm your password to turn off two-factor sign-in."}
              </p>
              <Field label="Your password">
                <Input type="password" autoComplete="current-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} aria-invalid={!!passwordError || undefined} />
              </Field>
              {passwordProblem}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => askPassword(null)}>
                  Cancel
                </Button>
                {confirm === "app-setup" ? (
                  <Button
                    disabled={twoFactor.busy || !confirmPassword}
                    loading={twoFactor.pending === "app-setup"}
                    onClick={() =>
                      run(twoFactor, "app-setup", async () => {
                        const r = await platformFetch<{ data: AppSetup }>("/auth/two-factor/app/setup", { method: "POST", body: { currentPassword: confirmPassword } });
                        setSetup(r.data);
                        setSetupPassword(confirmPassword);
                        askPassword(null);
                        return "Scan the QR code, then enter the code your app shows.";
                      })
                    }
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    disabled={twoFactor.busy || !confirmPassword}
                    loading={twoFactor.pending === "email-off"}
                    onClick={() =>
                      run(twoFactor, "email-off", async () => {
                        await platformFetch("/auth/two-factor", { method: "PUT", body: { enabled: false, currentPassword: confirmPassword } });
                        askPassword(null);
                        return "Two-factor sign-in is off.";
                      })
                    }
                  >
                    Turn off
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant={method ? "secondary" : "primary"} disabled={twoFactor.busy || !admin} onClick={() => askPassword("app-setup")}>
                <FiSmartphone className="h-4 w-4" /> {method === "email" ? "Switch to an authenticator app" : "Use an authenticator app"}
              </Button>
              {method === "email" ? (
                <Button variant="secondary" disabled={twoFactor.busy || !admin} onClick={() => askPassword("email-off")}>
                  <FiMail className="h-4 w-4" /> Turn off
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  disabled={twoFactor.busy || !admin}
                  loading={twoFactor.pending === "email-on"}
                  onClick={() =>
                    run(twoFactor, "email-on", async () => {
                      await platformFetch("/auth/two-factor", { method: "PUT", body: { enabled: true } });
                      return "Two-factor sign-in is on: a code will be emailed to you.";
                    })
                  }
                >
                  <FiMail className="h-4 w-4" /> Email me a code instead
                </Button>
              )}
            </div>
          )}
        </Panel>

        <Panel
          title={
            <span className="flex items-center gap-2">
              <FiKey className="h-4 w-4 text-neutral-400" /> Change password
            </span>
          }
          description="At least 10 characters. Changing it signs you out everywhere else you are signed in."
        >
          <div className="space-y-4">
            <Field label="Current password">
              <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </Field>
            <Field label="New password">
              <Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
            </Field>
            <div className="flex justify-end">
              <Button
                disabled={passwordChange.busy || next.length < 10 || !current}
                loading={passwordChange.pending === "pw"}
                onClick={() =>
                  run(passwordChange, "pw", async () => {
                    // The old token ended with the old password; the answer carries this session's new one.
                    const r = await platformFetch<{ token?: string }>("/auth/password", { method: "PUT", body: { currentPassword: current, newPassword: next } });
                    if (r.token) setPlatformToken(r.token);
                    setCurrent("");
                    setNext("");
                    return "Password updated. You have been signed out everywhere else.";
                  })
                }
              >
                Update password
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}

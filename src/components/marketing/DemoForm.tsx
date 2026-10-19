"use client";

// Posts to the platform API, which stores the request and emails the
// platform admins. The panel lists them under Demo requests.
//
// The same form is the contact page (/contact, `contact`): it needs nothing
// but the API, so it is the way to reach us that is always there.

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { CONTACT, DEMO_FORM, SITE, SUGGESTIONS } from "@/content/site";
import { publicFetch } from "@/lib/api";
import { trackConversion } from "@/lib/analytics";
import { stagger } from "@/lib/motion";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import Glow from "./Glow";
import ContactLinks from "./ContactLinks";

const input = "h-11 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export default function DemoForm({ contact = false }: { contact?: boolean }) {
  const copy = contact ? CONTACT : DEMO_FORM;
  const [form, setForm] = useState({ name: "", email: "", phone: "", gymName: "", gymSize: DEMO_FORM.sizes[0], country: "", message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Opened from "Share a suggestion" (/contact?topic=suggestion): the message
  // is started for them, and sending it is not counted as a demo request. Read
  // from the address once the page is running, so the form stays in the
  // page's static HTML (useSearchParams would take it out).
  const [suggestion, setSuggestion] = useState(false);
  useEffect(() => {
    if (!contact || new URLSearchParams(window.location.search).get("topic") !== SUGGESTIONS.topic) return;
    setSuggestion(true);
    setForm((f) => (f.message ? f : { ...f, message: SUGGESTIONS.prefill }));
  }, [contact]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await publicFetch("/demo-requests", { method: "POST", body: { ...form, source: typeof window !== "undefined" ? window.location.href : "landing" } });
      setDone(true);
      if (!suggestion) trackConversion("demo_request");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your request. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id={contact ? "contact" : "demo"} className={`relative overflow-hidden bg-slate-950 pb-24 text-white sm:pb-28 ${contact ? "pt-32 sm:pt-36" : "pt-24 sm:pt-28"}`}>
      <div className="bg-grid-dark absolute inset-0 [mask-image:radial-gradient(ellipse_at_bottom,black_10%,transparent_70%)]" aria-hidden="true" />
      <Glow className="-left-60 top-1/2 h-[720px] w-[720px] -translate-y-1/2" color="rgba(79,70,229,0.3)" />
      <Glow className="-right-60 top-1/3 h-[640px] w-[640px]" color="rgba(217,70,239,0.22)" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <SectionHeading dark align="left" eyebrow={copy.eyebrow} title={copy.title} text={copy.text} />
          {contact ? (
            <p className="mt-6 text-sm leading-relaxed text-slate-400">{CONTACT.existing}</p>
          ) : (
            <Reveal delay={200} as="div">
              <ul className="mt-8 space-y-3 text-sm text-slate-300">
                {["A 30-minute walkthrough on a gym like yours", "Your questions on migration, payments and the domain", "A written quote the same day"].map((t, i) => (
                  <li key={t} className="v-rise flex items-start gap-2.5" style={stagger(i)}>
                    <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
          {/* The form beside this is the fallback, so it is not linked again. */}
          <ContactLinks form={false} className="mt-8" />
        </div>

        <div className="glass rounded-3xl p-6 sm:p-8">
          {done ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
              <span className="a-pop flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                <FiCheckCircle className="h-7 w-7" />
              </span>
              <h3 className="a-rise mt-5 font-display text-2xl font-semibold" style={stagger(2)}>
                {contact ? "Message received" : "Request received"}
              </h3>
              <p className="a-rise mt-2 max-w-sm text-sm text-slate-300" style={stagger(3)}>
                Thanks {form.name.split(" ")[0]}. We will be in touch at {form.email} within one working day{contact ? "." : " to set up the walkthrough."}
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
              <label className="block sm:col-span-1">
                <span className="text-xs font-semibold text-slate-300">Your name</span>
                <input required value={form.name} onChange={set("name")} autoComplete="name" className={`${input} mt-1.5`} placeholder="Aisha Khan" />
              </label>
              <label className="block sm:col-span-1">
                <span className="text-xs font-semibold text-slate-300">Gym name</span>
                <input required value={form.gymName} onChange={set("gymName")} autoComplete="organization" className={`${input} mt-1.5`} placeholder="Iron Works Fitness" />
              </label>
              <label className="block sm:col-span-1">
                <span className="text-xs font-semibold text-slate-300">Work email</span>
                <input required type="email" value={form.email} onChange={set("email")} autoComplete="email" className={`${input} mt-1.5`} placeholder="you@yourgym.com" />
              </label>
              <label className="block sm:col-span-1">
                <span className="text-xs font-semibold text-slate-300">Phone / WhatsApp</span>
                <input type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" className={`${input} mt-1.5`} placeholder="+92 300 1234567" />
              </label>
              <label className="block sm:col-span-1">
                <span className="text-xs font-semibold text-slate-300">Gym size</span>
                <select value={form.gymSize} onChange={set("gymSize")} className={`${input} mt-1.5 [&>option]:text-slate-900`}>
                  {DEMO_FORM.sizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-1">
                <span className="text-xs font-semibold text-slate-300">City / country</span>
                <input value={form.country} onChange={set("country")} autoComplete="country-name" className={`${input} mt-1.5`} placeholder="Lahore, Pakistan" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-slate-300">{contact ? "Your message" : "Anything we should know?"}</span>
                <textarea value={form.message} onChange={set("message")} rows={3} className={`${input} mt-1.5 h-auto py-2.5`} placeholder={contact ? "Your question, or what you need help with…" : "Current software, number of locations, what is not working today…"} />
              </label>
              {/* Honeypot: real people never see or fill this. */}
              <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} className="hidden" aria-hidden="true" name="website" />

              {error && (
                <div className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-200 sm:col-span-2">
                  <p>{error}</p>
                  {/* The form failed: say who else to ask rather than leave them stuck. */}
                  {(SITE.whatsappUrl || SITE.contactEmail || SITE.contactPhone) && <ContactLinks form={false} className="mt-2 !text-xs" />}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-slate-500">
                  We use these details only to reply to you. See our{" "}
                  <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-300">
                    Privacy Policy
                  </Link>
                  .
                </p>
                <button type="submit" disabled={busy || !form.name.trim() || !form.email.trim() || !form.gymName.trim()} className="btn-shine btn-shine-dark group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-slate-900 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                  {busy ? "Sending…" : contact ? "Send message" : "Book my demo"} <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

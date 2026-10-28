// A small piece of the real product for each feature, drawn in markup rather
// than screenshotted so nothing goes stale and everything stays crisp. Each
// one animates in (v-* classes) when its card scrolls into view.

import { FiBell, FiCheck, FiDatabase, FiEdit3, FiKey, FiLock, FiPercent, FiPrinter, FiSearch, FiShield, FiSliders, FiSmartphone, FiTag, FiTool, FiTrendingUp, FiUploadCloud, FiUser, FiUserPlus, FiVolume2 } from "react-icons/fi";
import type { FeatureKey } from "@/content/features";
import { stagger } from "@/lib/motion";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`relative overflow-hidden rounded-xl border border-gp-edge bg-gradient-to-b from-gp-panel to-gp-graphite p-4 ${className}`}>{children}</div>;
}

// The payment link a member gets before the due date: the local ways to pay,
// into the gym's own Safepay account, then what happened next -- including a
// bank transfer whose screenshot waits for staff to approve it.
function BillingPicture() {
  return (
    <Frame className="flex h-full flex-col justify-center">
      <div className="v-rise rounded-xl bg-gp-void ring-1 ring-gp-bone/10 p-4 text-gp-bone shadow-lift" style={stagger(0)}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gp-slate">Iron Works · your fee</p>
            <p className="font-gp text-base font-semibold">Unlimited monthly</p>
          </div>
          <span className="v-pop rounded-full bg-gp-ember/15 px-2 py-0.5 text-[10px] font-semibold text-gp-ember ring-1 ring-inset ring-gp-ember/30" style={stagger(3)}>
            Due 4 Nov
          </span>
        </div>
        <p className="mt-3 font-gp text-2xl font-bold">
          Rs 5,000<span className="text-sm font-normal text-gp-slate"> · last day 7 Nov</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
          {["Card", "JazzCash", "Easypaisa", "Bank app"].map((m, i) => (
            <span key={m} className={`v-pop rounded-full px-2 py-0.5 ${m === "Easypaisa" ? "bg-gp-bone text-gp-ink" : "bg-gp-bone/10 text-gp-mist"}`} style={stagger(4 + i)}>
              {m}
            </span>
          ))}
        </div>
        <div className="v-pop mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-gp-bone py-1.5 text-xs font-semibold text-gp-ink" style={stagger(8)}>
          <FiLock className="h-3 w-3" /> Pay now
        </div>
        <p className="mt-1.5 text-center text-[10px] text-gp-slate">Straight to the gym&apos;s own account · Safepay</p>
      </div>
      <div className="mt-3 space-y-1.5 text-[11px]">
        {[
          ["Invoice #1042 · Easypaisa", "Paid", "text-gp-mint"],
          ["Bank transfer screenshot", "Staff to approve", "text-gp-ember"],
          ["Auto-pay · Visa •••• 4821", "Member agreed", "text-gp-mint"],
        ].map(([a, b, c], i) => (
          <div key={a} className="v-rise flex items-center justify-between rounded-lg bg-gp-raised px-3 py-1.5 ring-1 ring-gp-edge" style={stagger(9 + i)}>
            <span className="font-medium text-gp-mist">{a}</span>
            <span className={`font-semibold ${c}`}>{b}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function BookingPicture() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const blocks: Record<string, { t: string; c: string; s?: string }[]> = {
    Mon: [{ t: "HIIT", c: "bg-gp-mint" }, { t: "Yoga", c: "bg-gp-mint/60" }],
    Tue: [{ t: "Boxing", c: "bg-rose-400", s: "Full" }],
    Wed: [{ t: "HIIT", c: "bg-gp-mint" }, { t: "Pilates", c: "bg-gp-ember", s: "Waitlist 3" }],
    Thu: [{ t: "Spin", c: "bg-gp-mist" }],
    Fri: [{ t: "HIIT", c: "bg-gp-mint" }, { t: "Yoga", c: "bg-gp-mint/60" }],
  };
  let n = 0;
  return (
    <Frame>
      <div className="grid grid-cols-5 gap-1.5">
        {days.map((d) => (
          <div key={d}>
            <p className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gp-slate">{d}</p>
            <div className="space-y-1.5">
              {blocks[d].map((b) => (
                <div key={b.t + d} className={`v-pop rounded-md ${b.c} px-1.5 py-1.5 text-[10px] font-semibold text-gp-ink`} style={stagger(n++)}>
                  {b.t}
                  {b.s && <span className="block text-[9px] font-medium opacity-90">{b.s}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="v-rise mt-3 flex items-center gap-1.5 text-[11px] text-gp-slate" style={stagger(9)}>
        <FiBell className="h-3.5 w-3.5 text-gp-mint" /> “A spot opened in Pilates. You&apos;re in!”
      </p>
    </Frame>
  );
}

function PtPicture() {
  const slots = [
    ["07:00", "free"],
    ["08:00", "booked"],
    ["09:00", "free"],
    ["17:00", "free"],
    ["18:00", "booked"],
    ["19:00", "class"],
  ];
  return (
    <Frame>
      <div className="v-rise flex items-center gap-2.5" style={stagger(0)}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gp-ember to-gp-ember/70 text-[11px] font-bold text-gp-ink">MJ</span>
        <div>
          <p className="text-xs font-semibold text-gp-bone">Coach Marcus · today</p>
          <p className="text-[10px] text-gp-slate">Rs 1,500 a session · keeps 20%</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {slots.map(([t, s], i) => (
          <div key={t} className={`v-pop rounded-md px-2 py-1.5 text-center text-[11px] font-semibold ${s === "free" ? "bg-gp-mint/10 text-gp-mint ring-1 ring-inset ring-gp-mint/30" : s === "booked" ? "bg-gp-bone text-gp-ink" : "bg-gp-bone/5 text-gp-slate line-through"}`} style={stagger(1 + i)}>
            {t}
          </div>
        ))}
      </div>
      <p className="v-rise mt-3 text-[11px] text-gp-slate" style={stagger(8)}>
        Sara M. · <span className="font-semibold text-gp-bone">8 of 10</span> sessions left
      </p>
    </Frame>
  );
}

function FrontDeskPicture() {
  // A QR-ish pattern; purely decorative.
  const cells = "1101101011010110101011001101101011010110101011001101101011010110".split("");
  return (
    <Frame>
      <div className="flex items-center gap-4">
        <div className="v-pop relative grid shrink-0 grid-cols-8 gap-[2px] overflow-hidden rounded-lg bg-gp-raised p-2 ring-1 ring-gp-edge" style={stagger(0)}>
          {cells.map((c, i) => (
            <span key={i} className={`h-2 w-2 ${c === "1" ? "bg-gp-bone" : "bg-transparent"}`} />
          ))}
          <span className="a-scan pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-gp-mint/0 via-gp-mint/70 to-gp-mint/0" aria-hidden="true" />
        </div>
        <div className="min-w-0 text-[11px]">
          <p className="v-rise flex items-center gap-1.5 font-semibold text-gp-mint" style={stagger(1)}>
            <FiCheck className="h-3.5 w-3.5" /> Sara M. checked in 07:42
          </p>
          <p className="v-rise mt-0.5 text-gp-slate" style={stagger(2)}>
            Visit 14 this month
          </p>
          <p className="v-rise mt-2 flex items-center gap-1.5 text-rose-500" style={stagger(3)}>
            <FiVolume2 className="h-3.5 w-3.5" /> Omar A. · fee expired · “please renew”
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2 text-[10px] font-semibold text-gp-mist">
        {["QR kiosk", "Fingerprint app", "312 inside now"].map((c, i) => (
          <span key={c} className="v-pop rounded-full bg-gp-raised px-2 py-0.5 ring-1 ring-gp-edge" style={stagger(4 + i)}>
            {c}
          </span>
        ))}
      </div>
    </Frame>
  );
}

function MessagingPicture() {
  return (
    <Frame className="flex h-full flex-col justify-center">
      <div className="space-y-2.5">
        <div className="v-bubble-l flex items-end gap-2" style={stagger(0)}>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gp-mint text-[10px] font-bold text-gp-ink">W</span>
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-gp-mint px-3 py-2 text-[11px] text-gp-ink">Hi Sara, HIIT Blast is tonight at 18:00 in Studio A. See you there!</div>
        </div>
        <div className="v-bubble-r flex items-end justify-end gap-2" style={stagger(3)}>
          <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-gp-bone px-3 py-2 text-[11px] text-gp-ink">Your fee of Rs 5,000 is due tomorrow. Pay by card, JazzCash, Easypaisa or your bank app: ironworks.fit/pay/…</div>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gp-bone/15 text-[10px] font-bold text-gp-bone">S</span>
        </div>
        <div className="v-rise flex items-center gap-2.5 rounded-xl bg-gp-raised px-3 py-2 ring-1 ring-gp-edge" style={stagger(6)}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gp-mint/10 text-gp-mint">
            <FiBell className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 text-[11px]">
            <p className="font-semibold text-gp-bone">You&apos;re off the waitlist 🎉</p>
            <p className="truncate text-gp-slate">Reformer Pilates · Wed 09:00 · app notification</p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
        {["Not been in for 2 weeks → “we miss you”", "Membership ended → “come back” offer", "Birthday → a treat"].map((a, i) => (
          <span key={a} className="v-pop rounded-full bg-gp-mint/10 px-2 py-0.5 text-gp-mint ring-1 ring-inset ring-gp-mint/30" style={stagger(8 + i)}>
            {a}
          </span>
        ))}
      </div>
    </Frame>
  );
}

function PosPicture() {
  const lines = [
    ["Protein shake × 2", "Rs 1,200"],
    ["Whey 1kg", "Rs 8,500"],
    ["Locker · Oct", "Rs 1,000"],
  ];
  return (
    <Frame>
      <div className="v-rise rounded-lg bg-gp-raised p-3 text-[11px] text-gp-mist shadow-card ring-1 ring-gp-edge" style={stagger(0)}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gp-slate">Basket</p>
        <div className="mt-2 space-y-1">
          {lines.map(([a, b], i) => (
            <p key={a} className="v-rise flex justify-between" style={stagger(1 + i)}>
              <span>{a}</span>
              <span className="font-medium text-gp-bone">{b}</span>
            </p>
          ))}
        </div>
        <div className="mt-2 space-y-1 border-t border-dashed border-gp-edge pt-2 text-gp-slate">
          {[
            ["Discount", "−Rs 1,200"],
            ["Tax included (5%)", "Rs 452"],
          ].map(([a, b], i) => (
            <p key={a} className="v-rise flex justify-between" style={stagger(4 + i)}>
              <span>{a}</span>
              <span>{b}</span>
            </p>
          ))}
          <p className="v-rise flex justify-between font-gp text-sm font-bold text-gp-bone" style={stagger(6)}>
            <span>Total</span>
            <span>Rs 9,500</span>
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
        <div className="v-pop rounded-lg bg-gp-raised px-3 py-1.5 ring-1 ring-gp-edge" style={stagger(7)}>
          <p className="text-gp-slate">Cash given Rs 10,000</p>
          <p className="font-semibold text-gp-bone">Change Rs 500</p>
        </div>
        <div className="v-pop rounded-lg bg-gp-mint/10 px-3 py-1.5 ring-1 ring-gp-mint/30" style={stagger(8)}>
          <p className="text-gp-mint">Made on this sale</p>
          <p className="font-semibold text-gp-mint">Rs 2,150</p>
        </div>
      </div>
    </Frame>
  );
}

function StaffPicture() {
  const roles = [
    ["Manager", "bg-gp-mint"],
    ["Front desk", "bg-gp-mint"],
    ["Trainer", "bg-gp-ember"],
    ["Accountant", "bg-gp-mint"],
  ];
  const rows = [
    ["Salary", "Rs 60,000", ""],
    ["PT commission · 17 sessions", "Rs 5,100", ""],
    ["Unpaid day off", "−Rs 2,000", "text-rose-500"],
  ];
  return (
    <Frame>
      <div className="flex flex-wrap gap-1.5">
        {roles.map(([r, c], i) => (
          <span key={r} className="v-pop inline-flex items-center gap-1.5 rounded-full bg-gp-raised px-2.5 py-1 text-[11px] font-semibold text-gp-mist ring-1 ring-gp-edge" style={stagger(i)}>
            <span className={`h-2 w-2 rounded-full ${c}`} /> {r}
          </span>
        ))}
      </div>
      <div className="v-rise mt-3 rounded-lg bg-gp-raised p-3 ring-1 ring-gp-edge" style={stagger(4)}>
        <div className="flex items-center justify-between text-[11px]">
          <p className="font-semibold text-gp-bone">Payslip · September</p>
          <span className="v-pop rounded-full bg-gp-mint/10 px-2 py-0.5 text-[10px] font-semibold text-gp-mint" style={stagger(9)}>
            Paid
          </span>
        </div>
        <div className="mt-2 space-y-1 text-[11px] text-gp-mist">
          {rows.map(([l, v, c], i) => (
            <p key={l} className={`v-rise flex justify-between ${c}`} style={stagger(5 + i)}>
              <span>{l}</span>
              <span>{v}</span>
            </p>
          ))}
          <p className="v-rise flex justify-between border-t border-gp-edge pt-1 font-semibold text-gp-bone" style={stagger(8)}>
            <span>Take home</span>
            <span>Rs 63,100</span>
          </p>
        </div>
      </div>
    </Frame>
  );
}

function MembersPicture() {
  return (
    <Frame>
      <div className="flex items-center gap-3">
        <span className="v-pop flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gp-mint to-gp-mint/70 text-sm font-bold text-gp-ink" style={stagger(0)}>
          SM
        </span>
        <div className="v-rise min-w-0" style={stagger(1)}>
          <p className="text-sm font-semibold text-gp-bone">Sara Malik</p>
          <p className="truncate text-[11px] text-gp-slate">Unlimited monthly · member since Mar 2025</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
        {[
          ["Health form", "Done", "text-gp-mint"],
          ["Agreement", "Signed", "text-gp-mint"],
          ["Emergency contact", "Added", "text-gp-mint"],
          ["ID document", "Missing", "text-gp-ember"],
        ].map(([l, v, c], i) => (
          <div key={l} className="v-pop flex items-center justify-between rounded-md bg-gp-raised px-2.5 py-1.5 ring-1 ring-gp-edge" style={stagger(2 + i)}>
            <span className="text-gp-mist">{l}</span>
            <span className={`font-semibold ${c}`}>{v}</span>
          </div>
        ))}
      </div>
      <p className="v-rise mt-3 text-[11px] text-gp-slate" style={stagger(7)}>
        Imported <span className="font-semibold text-gp-bone">312 members</span> from members.csv
      </p>
    </Frame>
  );
}

function LeadsPicture() {
  const leads = [
    ["Daniel K.", "Asked about PT", "New", "bg-gp-mint/10 text-gp-mint"],
    ["Priya R.", "Free trial booked", "Trial", "bg-gp-ember/10 text-gp-ember"],
    ["Omar A.", "Joined · Unlimited", "Member", "bg-gp-mint/10 text-gp-mint"],
  ];
  return (
    <Frame>
      <ul className="space-y-1.5">
        {leads.map(([n, s, st, c], i) => (
          <li key={n} className="v-rise flex items-center gap-2.5 rounded-lg bg-gp-raised px-3 py-2 ring-1 ring-gp-edge" style={stagger(i * 2)}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gp-bone/5 text-[10px] font-bold text-gp-mist">{n[0]}</span>
            <div className="min-w-0 flex-1 text-[11px]">
              <p className="font-semibold text-gp-bone">{n}</p>
              <p className="truncate text-gp-slate">{s}</p>
            </div>
            <span className={`v-pop rounded-full px-2 py-0.5 text-[10px] font-semibold ${c}`} style={stagger(i * 2 + 2)}>
              {st}
            </span>
          </li>
        ))}
      </ul>
      <p className="v-rise mt-3 flex items-center gap-1.5 text-[11px] text-gp-slate" style={stagger(7)}>
        <FiUserPlus className="h-3.5 w-3.5 text-gp-ember" /> From your website&apos;s contact form
      </p>
    </Frame>
  );
}

function ReportsPicture() {
  const points = [12, 18, 15, 22, 26, 24, 31, 29, 36, 34, 41, 45];
  const max = Math.max(...points);
  const d = points.map((p, i) => `${(i / (points.length - 1)) * 100},${40 - (p / max) * 36}`).join(" ");
  return (
    <Frame>
      <div className="flex items-start justify-between">
        <div className="v-rise" style={stagger(0)}>
          <p className="text-[10px] uppercase tracking-wider text-gp-slate">This month</p>
          <p className="font-gp text-xl font-bold text-gp-bone">Rs 3,742,000</p>
        </div>
        <span className="v-pop inline-flex items-center gap-1 rounded-full bg-gp-mint/10 px-2 py-0.5 text-[10px] font-semibold text-gp-mint" style={stagger(6)}>
          <FiTrendingUp className="h-3 w-3" /> +4.2%
        </span>
      </div>
      <svg viewBox="0 0 100 42" className="mt-2 h-16 w-full text-gp-mint" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon className="v-fade" style={stagger(4)} points={`0,42 ${d} 100,42`} fill="url(#spark)" />
        <polyline className="v-draw" style={stagger(1)} points={d} pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[10px]">
        {[
          ["Members", "1,248"],
          ["Came in", "92%"],
          ["New leads", "37"],
        ].map(([l, v], i) => (
          <div key={l} className="v-pop rounded-md bg-gp-raised py-1.5 ring-1 ring-gp-edge" style={stagger(7 + i)}>
            <p className="font-semibold text-gp-bone">{v}</p>
            <p className="text-gp-slate">{l}</p>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function WebsitePicture() {
  return (
    <Frame className="flex h-full flex-col justify-center">
      <div className="v-rise overflow-hidden rounded-lg bg-gp-raised shadow-card ring-1 ring-gp-edge" style={stagger(0)}>
        <div className="flex items-center gap-1.5 border-b border-gp-edge bg-gp-bone/[0.03] px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-gp-bone/20" />
          <span className="h-2 w-2 rounded-full bg-gp-bone/20" />
          <span className="h-2 w-2 rounded-full bg-gp-bone/20" />
          <span className="ml-2 flex-1 rounded bg-gp-raised px-2 py-0.5 text-[10px] text-gp-slate ring-1 ring-gp-edge">
            <span className="text-gp-mint">🔒</span> ironworks.fit
          </span>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-gp font-bold text-gp-bone">IRON WORKS</span>
            <span className="v-pop rounded-full bg-gp-ember px-2 py-0.5 font-semibold text-gp-ink" style={stagger(5)}>
              Join
            </span>
          </div>
          <div className="v-rise mt-2 rounded-md bg-gradient-to-br from-gp-graphite to-gp-ember/30 p-3 text-gp-bone" style={stagger(2)}>
            <p className="font-gp text-xs font-bold">Train with coaches who know your name</p>
            <p className="mt-1 text-[9px] text-gp-ember">Classes · trainers · prices · blog · map</p>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {["bg-gp-ember", "bg-gp-mint", "bg-gp-bone/15"].map((c, i) => (
              <div key={c} className={`v-pop h-6 rounded ${c}`} style={stagger(3 + i)} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
        <span className="v-pop inline-flex items-center gap-1 rounded-full bg-gp-raised px-2 py-0.5 text-gp-mist ring-1 ring-gp-edge" style={stagger(7)}>
          <FiSmartphone className="h-3 w-3" /> Installs as an app
        </span>
        <span className="v-pop rounded-full bg-gp-raised px-2 py-0.5 text-gp-mist ring-1 ring-gp-edge" style={stagger(8)}>
          Padlock (SSL) included
        </span>
        <span className="v-pop rounded-full bg-gp-raised px-2 py-0.5 text-gp-mist ring-1 ring-gp-edge" style={stagger(9)}>
          Found on Google
        </span>
      </div>
    </Frame>
  );
}

function DataPicture() {
  return (
    <Frame>
      <div className="v-rise flex items-center gap-3 rounded-lg bg-gp-void ring-1 ring-gp-bone/10 px-3 py-2.5 text-gp-bone" style={stagger(0)}>
        <FiDatabase className="h-5 w-5 text-gp-mint" />
        <div className="min-w-0 text-[11px]">
          <p className="font-semibold">ironworks · private database</p>
          <p className="text-gp-slate">Only your gym. Nobody else&apos;s data inside.</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["English", "العربية", "اردو", "Español", "Français"].map((l, i) => (
          <span key={l} className="v-pop rounded-full bg-gp-raised px-2.5 py-1 text-[11px] font-semibold text-gp-mist ring-1 ring-gp-edge" style={stagger(2 + i)}>
            {l}
          </span>
        ))}
      </div>
      <p className="v-rise mt-3 text-[11px] text-gp-slate" style={stagger(8)}>
        Download members, payments and reports whenever you like.
      </p>
    </Frame>
  );
}

function OffersPicture() {
  return (
    <Frame className="flex h-full flex-col justify-center">
      <div className="v-pop relative overflow-hidden rounded-xl bg-gradient-to-br from-gp-ember to-gp-ember/75 p-4 text-gp-ink shadow-lift" style={stagger(0)}>
        <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-gp-panel" aria-hidden="true" />
        <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-gp-panel" aria-hidden="true" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-gp-ink/70">September offer</p>
        <p className="font-gp text-2xl font-extrabold tracking-[0.15em]">SEPT25</p>
        <p className="mt-1 text-[11px] text-gp-ink/80">25% off the first payment</p>
      </div>
      <div className="mt-3 space-y-1.5 text-[11px]">
        {[
          ["Runs until", "30 Sep"],
          ["Used", "18 of 50"],
          ["Applies to", "Unlimited monthly"],
        ].map(([a, b], i) => (
          <div key={a} className="v-rise flex items-center justify-between rounded-lg bg-gp-raised px-3 py-1.5 ring-1 ring-gp-edge" style={stagger(2 + i)}>
            <span className="text-gp-slate">{a}</span>
            <span className="font-semibold text-gp-bone">{b}</span>
          </div>
        ))}
      </div>
      <p className="v-rise mt-3 flex items-center justify-center gap-2 text-[11px] font-semibold text-gp-mist" style={stagger(6)}>
        <FiTag className="h-3.5 w-3.5 text-gp-ember" />
        <span className="text-gp-slate line-through">Rs 5,000</span>
        <span className="text-gp-bone">Rs 3,750 at checkout</span>
      </p>
    </Frame>
  );
}

function AppPicture() {
  return (
    <Frame className="flex h-full items-center justify-center">
      <div className="v-rise w-[190px] overflow-hidden rounded-[22px] bg-gp-void p-2.5 shadow-lift ring-1 ring-gp-edge-2" style={stagger(0)}>
        <span className="mx-auto mb-2 block h-1 w-10 rounded-full bg-gp-bone/25" aria-hidden="true" />
        <div className="flex items-center justify-between px-0.5">
          <div>
            <p className="text-[9px] text-gp-slate">Iron Works</p>
            <p className="font-gp text-sm font-bold text-gp-bone">Hi Sara</p>
          </div>
          <span className="v-pop flex h-6 w-6 items-center justify-center rounded-lg bg-gp-mint text-[10px] font-black text-gp-ink" style={stagger(2)}>
            IW
          </span>
        </div>

        <div className="v-pop mt-2 flex items-center gap-2 rounded-xl bg-gp-mint px-2.5 py-2 text-gp-ink" style={stagger(3)}>
          <FiSmartphone className="h-4 w-4" />
          <div>
            <p className="text-[10px] font-extrabold leading-tight">Check in</p>
            <p className="text-[8px] font-medium opacity-70">Show this at the desk</p>
          </div>
        </div>

        <div className="v-rise mt-2 rounded-xl bg-gp-bone/5 p-2.5 ring-1 ring-gp-bone/10" style={stagger(4)}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-gp-bone">Unlimited monthly</p>
            <span className="rounded-full bg-gp-mint/15 px-1.5 py-0.5 text-[8px] font-bold text-gp-mint">active</span>
          </div>
          <p className="mt-1 text-[9px] text-gp-slate">Runs until 22 Oct · 14 days</p>
        </div>

        <div className="mt-2 space-y-1">
          {[
            ["07:00", "Sunrise Yoga"],
            ["18:00", "Boxing"],
          ].map(([t, n], i) => (
            <div key={n} className="v-pop flex items-center gap-2 rounded-lg bg-gp-bone/5 px-2 py-1.5" style={stagger(5 + i)}>
              <span className="text-[9px] font-bold text-gp-bone">{t}</span>
              <span className="flex-1 truncate text-[9px] text-gp-mist">{n}</span>
              <span className="text-[8px] font-semibold text-gp-mint">booked</span>
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-gp-bone/10 px-2 pt-1.5">
          {["Home", "Classes", "Card", "You"].map((t, i) => (
            <span key={t} className={`text-[8px] font-semibold ${i === 0 ? "text-gp-mint" : "text-gp-slate"}`}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </Frame>
  );
}

function ContentPicture() {
  const rows = [
    ["Hero slides", "3 slides", "bg-gp-mint"],
    ["About / Intro", "Live", "bg-gp-mint"],
    ["Stats band", "Live", "bg-gp-mint"],
    ["Testimonials", "6 quotes", "bg-gp-ember"],
  ];
  return (
    <Frame>
      <ul className="space-y-1.5">
        {rows.map(([l, v, c], i) => (
          <li key={l} className="v-rise flex items-center gap-2.5 rounded-lg bg-gp-raised px-3 py-2 ring-1 ring-gp-edge" style={stagger(i)}>
            <span className="flex flex-col gap-[3px]" aria-hidden="true">
              <span className="h-[2px] w-3 rounded bg-gp-bone/20" />
              <span className="h-[2px] w-3 rounded bg-gp-bone/20" />
              <span className="h-[2px] w-3 rounded bg-gp-bone/20" />
            </span>
            <span className="flex-1 text-[11px] font-semibold text-gp-bone">{l}</span>
            <span className={`h-1.5 w-1.5 rounded-full ${c}`} />
            <span className="text-[10px] font-medium text-gp-slate">{v}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {["bg-gp-bone/10", "bg-gp-mint", "bg-gp-mint", "bg-gp-ember"].map((c, i) => (
          <div key={c} className={`v-pop h-8 rounded-md ${c}`} style={stagger(5 + i)} />
        ))}
      </div>
      <p className="v-rise mt-3 flex items-center gap-1.5 text-[11px] text-gp-slate" style={stagger(9)}>
        <FiEdit3 className="h-3.5 w-3.5 text-rose-500" /> Saved · your website is already showing it
      </p>
    </Frame>
  );
}

function BooksPicture() {
  const lines: [string, string, string][] = [
    ["Membership fees", "Rs 1,230,000", "in"],
    ["Admission fees", "Rs 67,500", "in"],
    ["Trainer fees", "Rs 195,000", "in"],
    ["Shop sales", "Rs 210,500", "in"],
    ["Refunds", "−Rs 12,000", "in"],
    ["Trainer commission", "−Rs 107,500", "out"],
    ["Expenses", "−Rs 324,000", "out"],
    ["Equipment bought", "−Rs 145,000", "out"],
    ["Salaries", "−Rs 480,000", "out"],
  ];
  return (
    <Frame>
      <div className="v-rise flex items-center justify-between" style={stagger(0)}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gp-slate">Profit and loss · September</p>
        <span className="rounded-full bg-gp-raised px-2 py-0.5 text-[10px] font-semibold text-gp-mist ring-1 ring-gp-edge">This month</span>
      </div>
      <div className="mt-2 space-y-0.5 text-[11px]">
        {lines.map(([l, v, kind], i) => (
          <p key={l} className={`v-rise flex justify-between rounded px-2 py-0.5 ${kind === "in" ? "text-gp-mist" : "text-gp-slate"}`} style={stagger(1 + i, 0)}>
            <span>{l}</span>
            <span className={`font-medium ${v.startsWith("−") ? "text-rose-500" : "text-gp-bone"}`}>{v}</span>
          </p>
        ))}
      </div>
      <p className="v-pop mt-2 flex items-center justify-between rounded-lg bg-gp-void ring-1 ring-gp-bone/10 px-3 py-2 text-gp-bone" style={stagger(11)}>
        <span className="text-[11px] font-semibold">Net profit</span>
        <span className="font-gp text-base font-bold text-gp-mint">Rs 634,500</span>
      </p>
    </Frame>
  );
}

function SecurityPicture() {
  return (
    <Frame>
      <div className="v-rise flex items-center gap-3 rounded-lg bg-gp-void ring-1 ring-gp-bone/10 px-3 py-2.5 text-gp-bone" style={stagger(0)}>
        <FiShield className="h-5 w-5 shrink-0 text-gp-mint" />
        <div className="min-w-0 text-[11px]">
          <p className="font-semibold">Two-step sign-in is on</p>
          <p className="text-gp-slate">A code by email before anyone gets in.</p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-[11px]">
        {[
          ["Front desk", "Members, bookings"],
          ["Accountant", "The books only"],
          ["Trainer", "Own classes"],
        ].map(([r, s], i) => (
          <div key={r} className="v-rise flex items-center justify-between rounded-lg bg-gp-raised px-3 py-1.5 ring-1 ring-gp-edge" style={stagger(2 + i)}>
            <span className="font-semibold text-gp-bone">{r}</span>
            <span className="flex items-center gap-1 font-medium text-gp-mint">
              <FiLock className="h-3 w-3" /> {s}
            </span>
          </div>
        ))}
      </div>
      <p className="v-rise mt-3 font-mono text-[10px] text-gp-slate" style={stagger(7)}>
        14:02 · Sara changed Unlimited monthly Rs 5,000 → Rs 5,500
      </p>
    </Frame>
  );
}

function SetupPicture() {
  // The eight schemes a gym can pick, in their real accent colours.
  const swatches = ["#ff6b2c", "#f5f5f7", "#38bdf8", "#e11d48", "#bee304", "#8b5cf6", "#10b981", "#f5a524"];
  return (
    <Frame>
      <div className="space-y-1.5 text-[11px]">
        {[
          ["Country", "Pakistan"],
          ["Currency", "PKR ₨"],
          ["Clock", "24-hour · Asia/Karachi"],
        ].map(([l, v], i) => (
          <div key={l} className="v-rise flex items-center justify-between rounded-lg bg-gp-raised px-3 py-1.5 ring-1 ring-gp-edge" style={stagger(i)}>
            <span className="text-gp-slate">{l}</span>
            <span className="font-semibold text-gp-bone">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["English", "العربية", "اردو", "Español", "Français"].map((l, i) => (
          <span key={l} className="v-pop rounded-full bg-gp-raised px-2 py-0.5 text-[10px] font-semibold text-gp-mist ring-1 ring-gp-edge" style={stagger(3 + i)}>
            {l}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <FiSliders className="h-3.5 w-3.5 shrink-0 text-gp-slate" />
        <div className="flex flex-1 gap-1.5">
          {swatches.map((c, i) => (
            <span key={c} className={`v-pop h-5 flex-1 rounded ${i === 4 ? "ring-2 ring-gp-bone ring-offset-1 ring-offset-gp-panel" : "ring-1 ring-gp-edge"}`} style={{ ...stagger(8 + i), background: c }} />
          ))}
        </div>
      </div>
    </Frame>
  );
}

function SelfServicePicture() {
  const tabs = ["Profile", "My classes", "History", "Check-in QR"];
  return (
    <Frame>
      <div className="v-rise overflow-hidden rounded-lg bg-gp-raised shadow-card ring-1 ring-gp-edge" style={stagger(0)}>
        <div className="flex items-center gap-1.5 border-b border-gp-edge bg-gp-bone/[0.03] px-3 py-1.5 text-[10px] text-gp-slate">
          <span className="h-2 w-2 rounded-full bg-gp-bone/20" />
          <span className="ml-1 truncate">ironworks.fit/my-account</span>
        </div>
        <div className="flex gap-1 border-b border-gp-edge px-2 pt-2">
          {tabs.map((t, i) => (
            <span
              key={t}
              className={`v-pop rounded-t-md px-2 py-1 text-[9.5px] font-semibold ${i === 0 ? "bg-gp-bone text-gp-ink" : "text-gp-slate"}`}
              style={stagger(1 + i)}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="space-y-1.5 p-2.5 text-[11px]">
          {[
            ["Next class", "Boxing · Tue 18:00"],
            ["Membership", "Unlimited · to 22 Oct"],
            ["Invoice #1042", "Download"],
          ].map(([a, b], i) => (
            <div key={a} className="v-rise flex items-center justify-between rounded-md bg-gp-bone/[0.03] px-2.5 py-1.5" style={stagger(5 + i)}>
              <span className="text-gp-slate">{a}</span>
              <span className="font-semibold text-gp-bone">{b}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="v-rise mt-3 flex items-center gap-1.5 text-[11px] text-gp-slate" style={stagger(9)}>
        <FiUser className="h-3.5 w-3.5 text-gp-ember" /> Nobody had to ask the front desk
      </p>
    </Frame>
  );
}

function DeskSalePicture() {
  const rows = [
    ["Package", "Monthly · Rs 5,000"],
    ["Starts", "In 3 days"],
    ["Discount", "−Rs 500 · student"],
    ["Admission fee", "Rs 1,000"],
    ["Trainer", "Coach Marcus · Rs 3,000"],
  ];
  return (
    <Frame>
      <div className="v-rise flex items-center gap-2.5" style={stagger(0)}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gp-mint to-gp-mint/70 text-[11px] font-bold text-gp-ink">AK</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gp-bone">Ali Khan · new member</p>
          <p className="font-mono text-[10px] text-gp-slate">GP-0213</p>
        </div>
      </div>
      <div className="mt-3 space-y-1 text-[11px]">
        {rows.map(([l, v], i) => (
          <div key={l} className="v-rise flex items-center justify-between rounded-md bg-gp-raised px-2.5 py-1 ring-1 ring-gp-edge" style={stagger(1 + i)}>
            <span className="text-gp-slate">{l}</span>
            <span className="font-semibold text-gp-bone">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1 text-[10px] font-semibold">
        {["Cash", "Card", "Bank", "JazzCash", "Easypaisa"].map((m, i) => (
          <span key={m} className={`v-pop rounded-full px-2 py-0.5 ${m === "JazzCash" ? "bg-gp-bone text-gp-ink" : "bg-gp-raised text-gp-mist ring-1 ring-gp-edge"}`} style={stagger(6 + i)}>
            {m}
          </span>
        ))}
      </div>
      <p className="v-rise mt-2.5 flex justify-between border-t border-gp-edge pt-2 text-[11px]" style={stagger(9)}>
        <span className="text-gp-slate">
          Total <span className="font-semibold text-gp-bone">Rs 8,500</span> · paid Rs 5,000
        </span>
        <span className="font-semibold text-gp-ember">Rs 3,500 due</span>
      </p>
    </Frame>
  );
}

function DuesPicture() {
  const owing = [
    ["Ali Khan", "GP-0213", "Rs 3,500"],
    ["Hina Rauf", "GP-0098", "Rs 1,200"],
    ["Bilal Shah", "GP-0187", "Rs 800"],
  ];
  return (
    <Frame>
      <p className="v-rise flex items-center gap-2 text-[11px] font-semibold text-gp-mist" style={stagger(0)}>
        <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-gp-bone text-gp-ink">
          <FiCheck className="h-3 w-3" />
        </span>
        Has dues · 3 members
      </p>
      <ul className="mt-2 space-y-1.5">
        {owing.map(([n, id, due], i) => (
          <li key={n} className="v-rise flex items-center justify-between rounded-lg bg-gp-raised px-3 py-1.5 text-[11px] ring-1 ring-gp-edge" style={stagger(1 + i)}>
            <span className="font-semibold text-gp-bone">
              {n} <span className="font-mono text-[10px] font-normal text-gp-slate">{id}</span>
            </span>
            <span className="font-semibold text-gp-ember">{due}</span>
          </li>
        ))}
      </ul>
      <div className="v-pop mt-3 rounded-lg bg-gp-void ring-1 ring-gp-bone/10 p-3 text-[11px] text-gp-bone" style={stagger(5)}>
        <p className="font-semibold">Record payment · Ali Khan</p>
        <p className="mt-1 text-gp-mist">Rs 2,000 · Cash</p>
        <p className="mt-1.5 flex justify-between border-t border-gp-bone/10 pt-1.5">
          <span className="text-gp-slate">Balance left</span>
          <span className="font-semibold text-gp-ember">Rs 1,500</span>
        </p>
      </div>
    </Frame>
  );
}

function RenewalsPicture() {
  const tabs = ["Expiring", "Expired / unpaid", "Dues"];
  const due = [
    ["Hina Rauf", "Ends today", "bg-rose-500/10 text-rose-500"],
    ["Bilal Shah", "2 days left", "bg-gp-ember/10 text-gp-ember"],
    ["Sara Malik", "5 days left", "bg-gp-ember/10 text-gp-ember"],
  ];
  return (
    <Frame>
      <div className="flex flex-wrap gap-1 text-[10px] font-semibold">
        {tabs.map((t, i) => (
          <span key={t} className={`v-pop rounded-full px-2 py-0.5 ${i === 0 ? "bg-gp-bone text-gp-ink" : "bg-gp-raised text-gp-mist ring-1 ring-gp-edge"}`} style={stagger(i)}>
            {t}
          </span>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-gp-slate">
        <span className="mr-0.5">Next</span>
        {[1, 3, 7, 15, 30].map((n, i) => (
          <span key={n} className={`v-pop rounded-md px-1.5 py-0.5 font-semibold ${n === 7 ? "bg-gp-mint/10 text-gp-mint" : "bg-gp-raised ring-1 ring-gp-edge"}`} style={stagger(3 + i, 0)}>
            {n}
          </span>
        ))}
        <span>days</span>
      </div>
      <ul className="mt-2.5 space-y-1.5">
        {due.map(([n, d, c], i) => (
          <li key={n} className="v-rise flex items-center gap-2 rounded-lg bg-gp-raised px-3 py-1.5 text-[11px] ring-1 ring-gp-edge" style={stagger(4 + i)}>
            <span className="flex-1 font-semibold text-gp-bone">{n}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c}`}>{d}</span>
            <span className="rounded-md bg-gp-bone px-2 py-0.5 text-[10px] font-semibold text-gp-ink">Collect</span>
          </li>
        ))}
      </ul>
      <div className="v-rise mt-2.5 flex gap-1.5 text-[10px] font-semibold text-gp-mist" style={stagger(8)}>
        <span className="rounded-md bg-gp-raised px-2 py-0.5 ring-1 ring-gp-edge">Export CSV</span>
        <span className="inline-flex items-center gap-1 rounded-md bg-gp-raised px-2 py-0.5 ring-1 ring-gp-edge">
          <FiPrinter className="h-3 w-3" /> Print
        </span>
      </div>
    </Frame>
  );
}

function FeeDeskPicture() {
  return (
    <Frame>
      <div className="v-rise flex items-center gap-2 rounded-lg bg-gp-raised px-3 py-2 ring-1 ring-gp-edge" style={stagger(0)}>
        <FiSearch className="h-3.5 w-3.5 text-gp-slate" />
        <span className="flex-1 font-mono text-[11px] text-gp-bone">184</span>
        <span className="rounded border border-gp-edge px-1 font-mono text-[9px] text-gp-slate">/</span>
      </div>
      <div className="v-rise mt-2 rounded-lg bg-gp-raised p-3 ring-1 ring-gp-edge" style={stagger(1)}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-gp-ember/70 text-[10px] font-bold text-white">OA</span>
          <div className="min-w-0 flex-1 text-[11px]">
            <p className="font-semibold text-gp-bone">
              Omar Aziz <span className="font-mono text-[10px] font-normal text-gp-slate">GP-0184</span>
            </p>
            <p className="truncate text-gp-slate">Monthly · Rs 5,000</p>
          </div>
          <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-500">3 days overdue</span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1 text-[10px] font-semibold">
          {[
            ["Collect & renew", "R"],
            ["Collect dues", "D"],
            ["New", "N"],
          ].map(([label, k], i) => (
            <span key={label} className={`v-pop inline-flex items-center gap-1 rounded-md px-2 py-1 ${i === 0 ? "bg-gp-bone text-gp-ink" : "bg-gp-bone/[0.03] text-gp-mist ring-1 ring-gp-edge"}`} style={stagger(3 + i)}>
              {label}
              <span className={`rounded px-1 font-mono text-[9px] ${i === 0 ? "bg-gp-ink/10" : "bg-gp-raised ring-1 ring-gp-edge"}`}>{k}</span>
            </span>
          ))}
        </div>
      </div>
      <p className="v-rise mt-2.5 flex items-center justify-between rounded-lg bg-gp-mint/10 px-3 py-1.5 text-[11px] ring-1 ring-gp-mint/30" style={stagger(7)}>
        <span className="font-semibold text-gp-mint">Rs 5,000 collected · Cash</span>
        <span className="inline-flex items-center gap-1 font-semibold text-gp-mint">
          <FiPrinter className="h-3 w-3" /> Receipt
        </span>
      </p>
    </Frame>
  );
}

function LoginsPicture() {
  return (
    <Frame>
      <div className="v-rise rounded-lg bg-gp-raised p-3 ring-1 ring-gp-edge" style={stagger(0)}>
        <p className="text-[11px] font-semibold text-gp-bone">Set password · Ali Khan</p>
        <div className="mt-2 space-y-1 text-[11px]">
          {[
            ["Email", "None"],
            ["Phone", "0300 555 0142"],
            ["Username", "alikhan"],
          ].map(([l, v], i) => (
            <p key={l} className="v-rise flex justify-between" style={stagger(1 + i)}>
              <span className="text-gp-slate">{l}</span>
              <span className="font-semibold text-gp-bone">{v}</span>
            </p>
          ))}
        </div>
      </div>
      <div className="v-pop mt-3 flex items-center gap-2 rounded-lg bg-gp-void ring-1 ring-gp-bone/10 px-3 py-2.5 text-gp-bone" style={stagger(5)}>
        <FiKey className="h-4 w-4 shrink-0 text-gp-ember" />
        <span className="flex-1 font-mono text-xs tracking-wider">hR7wKp4tMz9qXe</span>
        <span className="rounded-md bg-gp-bone/10 px-2 py-0.5 text-[10px] font-semibold">Copy</span>
      </div>
      <p className="v-rise mt-2 text-[11px] text-gp-slate" style={stagger(7)}>
        Shown once. Their old sessions are signed out.
      </p>
    </Frame>
  );
}

function ImportPicture() {
  return (
    <Frame>
      <div className="v-rise flex items-center gap-2.5 rounded-lg bg-gp-raised px-3 py-2 ring-1 ring-gp-edge" style={stagger(0)}>
        <FiUploadCloud className="h-4 w-4 text-gp-mint" />
        <span className="flex-1 font-mono text-[11px] text-gp-mist">members-export.csv</span>
        <span className="rounded-full bg-gp-mint/10 px-2 py-0.5 text-[10px] font-semibold text-gp-mint">Preview</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
        {[
          ["312", "members"],
          ["298", "memberships"],
          ["41", "no email"],
        ].map(([v, l], i) => (
          <div key={l} className="v-pop rounded-lg bg-gp-raised py-1.5 ring-1 ring-gp-edge" style={stagger(1 + i)}>
            <p className="font-gp text-sm font-bold text-gp-bone">{v}</p>
            <p className="text-[10px] text-gp-slate">{l}</p>
          </div>
        ))}
      </div>
      <p className="v-rise mt-3 text-[10px] text-gp-slate" style={stagger(5)}>
        Recognised: name · phone · member ID · package · start · expiry
      </p>
      <p className="v-rise mt-1.5 rounded-md bg-gp-ember/10 px-2.5 py-1.5 text-[10px] text-gp-ember ring-1 ring-gp-ember/30" style={stagger(6)}>
        Line 18: no package called “Gold”
      </p>
    </Frame>
  );
}

function AlertsPicture() {
  const bars = [30, 70, 45, 90, 55, 80, 35, 65, 40];
  const rows = [
    ["Sara M.", "Checked in", "bg-gp-mint", "text-gp-mint"],
    ["Ali K.", "Balance due Rs 1,500", "bg-gp-ember", "text-gp-ember"],
    ["Omar A.", "Membership expired", "bg-rose-500", "text-rose-500"],
  ];
  return (
    <Frame className="flex h-full flex-col justify-center">
      <div className="v-pop flex items-center gap-3 rounded-xl bg-gp-void ring-1 ring-gp-bone/10 px-3 py-3 text-gp-bone shadow-lift" style={stagger(0)}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-500">
          <FiVolume2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">“Fee expired, please renew”</p>
          <div className="mt-1.5 flex h-4 items-end gap-[3px]" aria-hidden="true">
            {bars.map((h, i) => (
              <span key={i} className="v-fill-y w-1 rounded-full bg-rose-400/70" style={{ ...stagger(1 + i, 0), height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5 text-[11px]">
        {rows.map(([n, s, dot, c], i) => (
          <li key={n} className="v-rise flex items-center gap-2 rounded-lg bg-gp-raised px-3 py-1.5 ring-1 ring-gp-edge" style={stagger(4 + i)}>
            <span className={`h-2 w-2 rounded-full ${dot}`} />
            <span className="font-semibold text-gp-bone">{n}</span>
            <span className={`ml-auto font-medium ${c}`}>{s}</span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function AttendancePicture() {
  const counts = [
    ["In now", "42", "text-gp-bone"],
    ["Paid", "118", "text-gp-mint"],
    ["Unpaid", "6", "text-rose-500"],
    ["Owing", "4", "text-gp-ember"],
  ];
  const rows = [
    ["#131", "07:42", "Sara M.", "Paid", "bg-gp-mint/10 text-gp-mint"],
    ["#132", "07:45", "Omar A.", "Unpaid", "bg-rose-500/10 text-rose-500"],
    ["#133", "07:51", "Ali K.", "Balance due", "bg-gp-ember/10 text-gp-ember"],
  ];
  return (
    <Frame>
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {counts.map(([l, v, c], i) => (
          <div key={l} className="v-pop rounded-lg bg-gp-raised py-1.5 ring-1 ring-gp-edge" style={stagger(i)}>
            <p className={`font-gp text-sm font-bold ${c}`}>{v}</p>
            <p className="text-[9.5px] text-gp-slate">{l}</p>
          </div>
        ))}
      </div>
      <ul className="mt-3 space-y-1.5 text-[11px]">
        {rows.map(([n, t, name, s, c], i) => (
          <li key={n} className="v-rise flex items-center gap-2 rounded-lg bg-gp-raised px-2.5 py-1.5 ring-1 ring-gp-edge" style={stagger(4 + i)}>
            <span className="font-mono text-[10px] text-gp-slate">{n}</span>
            <span className="font-mono text-[10px] text-gp-slate">{t}</span>
            <span className="flex-1 truncate font-semibold text-gp-bone">{name}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c}`}>{s}</span>
          </li>
        ))}
      </ul>
      <p className="v-rise mt-2.5 flex items-center gap-1.5 text-[10px] text-gp-slate" style={stagger(8)}>
        <span className="a-blink h-1.5 w-1.5 rounded-full bg-gp-mint" aria-hidden="true" /> Live · refreshes every 15 seconds
      </p>
    </Frame>
  );
}

function DailySalesPicture() {
  const heads = [
    ["New sign-ups", "20,000"],
    ["Renewals", "45,000"],
    ["Admission", "3,000"],
    ["Trainer fees", "6,000"],
    ["Dues collected", "7,500"],
    ["Shop", "4,250"],
  ];
  const methods = [
    ["Cash", 41250, "bg-gp-mint"],
    ["Card", 18000, "bg-gp-mist"],
    ["JazzCash", 16500, "bg-gp-ember"],
    ["Easypaisa", 10000, "bg-gp-mint/50"],
  ] as const;
  const total = 85750;
  return (
    <Frame>
      <p className="v-rise text-[10px] font-semibold uppercase tracking-wider text-gp-slate" style={stagger(0)}>
        Daily sales · Tue 30 Sep · Rs
      </p>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
        {heads.map(([l, v], i) => (
          <p key={l} className="v-rise flex justify-between" style={stagger(1 + i, 0)}>
            <span className="text-gp-slate">{l}</span>
            <span className="font-medium text-gp-bone">{v}</span>
          </p>
        ))}
      </div>
      <p className="v-rise mt-2 flex justify-between border-t border-gp-edge pt-1.5 text-xs font-bold text-gp-bone" style={stagger(7)}>
        <span>Day total</span>
        <span>Rs 85,750</span>
      </p>
      <div className="mt-2.5 flex h-2 overflow-hidden rounded-full" aria-hidden="true">
        {methods.map(([l, v, c], i) => (
          <span key={l} className={`v-fill h-full origin-left ${c}`} style={{ ...stagger(8 + i), width: `${(v / total) * 100}%` }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gp-mist">
        {methods.map(([l, v, c]) => (
          <span key={l} className="inline-flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${c}`} /> {l} {v.toLocaleString("en-US")}
          </span>
        ))}
      </div>
    </Frame>
  );
}

function AssetsPicture() {
  const assets = [
    ["Treadmill T5", "Service due in 4 days", "text-gp-ember"],
    ["Cable crossover", "Service overdue", "text-rose-500"],
    ["Air conditioner", "Warranty ends 21 Oct", "text-gp-mint"],
  ];
  return (
    <Frame>
      <div className="v-rise flex items-center justify-between" style={stagger(0)}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gp-slate">Asset register</p>
        <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-gp-raised ring-1 ring-gp-edge">
          <FiBell className="h-3.5 w-3.5 text-gp-mist" />
          <span className="v-pop absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white" style={stagger(5)}>
            3
          </span>
        </span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {assets.map(([n, s, c], i) => (
          <li key={n} className="v-rise flex items-center gap-2.5 rounded-lg bg-gp-raised px-3 py-2 ring-1 ring-gp-edge" style={stagger(1 + i)}>
            <FiTool className="h-3.5 w-3.5 shrink-0 text-gp-slate" />
            <div className="min-w-0 flex-1 text-[11px]">
              <p className="font-semibold text-gp-bone">{n}</p>
              <p className={`font-medium ${c}`}>{s}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="v-rise mt-2.5 text-[10px] text-gp-slate" style={stagger(6)}>
        Bought 12 Mar 2025 · Rs 450,000 · invoice INV-2291
      </p>
    </Frame>
  );
}

function ReceiptsPicture() {
  return (
    <Frame className="flex h-full items-center justify-center gap-4">
      <div className="v-rise w-[168px] bg-gp-raised px-3 pb-4 pt-3 font-mono text-[10px] text-gp-mist shadow-card ring-1 ring-gp-edge [clip-path:polygon(0_0,100%_0,100%_calc(100%-6px),92%_100%,84%_calc(100%-6px),76%_100%,68%_calc(100%-6px),60%_100%,52%_calc(100%-6px),44%_100%,36%_calc(100%-6px),28%_100%,20%_calc(100%-6px),12%_100%,4%_calc(100%-6px),0_100%)]" style={stagger(0)}>
        <p className="text-center font-sans text-xs font-extrabold tracking-wider text-gp-bone">IRON WORKS</p>
        <p className="text-center text-[9px] text-gp-slate">12 Foundry Lane · 0300 555 0100</p>
        <p className="text-center text-[9px] text-gp-slate">Tax no. 4471-22</p>
        <div className="mt-2 space-y-0.5 border-t border-dashed border-gp-edge-2 pt-1.5">
          {[
            ["Shake ×2", "12.00"],
            ["Whey 1kg", "42.00"],
            ["Locker Oct", "10.00"],
          ].map(([a, b], i) => (
            <p key={a} className="v-rise flex justify-between" style={stagger(1 + i)}>
              <span>{a}</span>
              <span>{b}</span>
            </p>
          ))}
        </div>
        <p className="v-rise mt-1.5 flex justify-between border-t border-dashed border-gp-edge-2 pt-1.5 font-bold text-gp-bone" style={stagger(5)}>
          <span>TOTAL</span>
          <span>60.00</span>
        </p>
        <p className="v-fade mt-2 text-center text-[9px] text-gp-slate" style={stagger(7)}>
          Thank you, see you tomorrow!
        </p>
      </div>
      <div className="flex flex-col gap-1.5 text-[10px] font-semibold">
        {["80 mm", "58 mm"].map((w, i) => (
          <span key={w} className={`v-pop rounded-full px-2.5 py-1 ${i === 0 ? "bg-gp-bone text-gp-ink" : "bg-gp-raised text-gp-mist ring-1 ring-gp-edge"}`} style={stagger(8 + i)}>
            {w}
          </span>
        ))}
        <span className="v-pop inline-flex items-center gap-1 rounded-full bg-gp-raised px-2.5 py-1 text-gp-mist ring-1 ring-gp-edge" style={stagger(10)}>
          <FiPrinter className="h-3 w-3" /> Print
        </span>
      </div>
    </Frame>
  );
}

function TrainerPayPicture() {
  const trainers = [
    ["MJ", "Coach Marcus", "Salary Rs 40,000 + 20% a session", "Payslip", "from-gp-ember to-gp-ember/70"],
    ["LN", "Coach Lina", "Commission only · Rs 500 a session", "Pay by hand", "from-gp-mint to-gp-mint/70"],
  ];
  return (
    <Frame>
      <ul className="space-y-2">
        {trainers.map(([ini, n, terms, paid, g], i) => (
          <li key={n} className="v-rise flex items-center gap-2.5 rounded-lg bg-gp-raised px-3 py-2 ring-1 ring-gp-edge" style={stagger(i * 2)}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${g} text-[10px] font-bold text-gp-ink`}>{ini}</span>
            <div className="min-w-0 flex-1 text-[11px]">
              <p className="font-semibold text-gp-bone">{n}</p>
              <p className="truncate text-gp-slate">{terms}</p>
            </div>
            <span className="v-pop rounded-full bg-gp-bone/5 px-2 py-0.5 text-[10px] font-semibold text-gp-mist" style={stagger(i * 2 + 1)}>
              {paid}
            </span>
          </li>
        ))}
      </ul>
      <div className="v-rise mt-3 flex items-center justify-between rounded-lg bg-gp-ember/10 px-3 py-2 text-[11px] ring-1 ring-gp-ember/30" style={stagger(5)}>
        <span className="flex items-center gap-1.5 text-gp-ember">
          <FiPercent className="h-3.5 w-3.5" /> 17 sessions this month
        </span>
        <span className="font-semibold text-gp-ember">Rs 5,100 commission</span>
      </div>
    </Frame>
  );
}

/** Keyed by the feature key in content/features.ts. */
export const FEATURE_PICTURES: Record<FeatureKey, React.ComponentType> = {
  members: MembersPicture,
  desksale: DeskSalePicture,
  feedesk: FeeDeskPicture,
  dues: DuesPicture,
  renewals: RenewalsPicture,
  logins: LoginsPicture,
  import: ImportPicture,
  frontdesk: FrontDeskPicture,
  alerts: AlertsPicture,
  attendance: AttendancePicture,
  billing: BillingPicture,
  offers: OffersPicture,
  reports: ReportsPicture,
  dailysales: DailySalesPicture,
  books: BooksPicture,
  assets: AssetsPicture,
  pos: PosPicture,
  receipts: ReceiptsPicture,
  booking: BookingPicture,
  pt: PtPicture,
  staff: StaffPicture,
  trainerpay: TrainerPayPicture,
  website: WebsitePicture,
  content: ContentPicture,
  app: AppPicture,
  selfservice: SelfServicePicture,
  messaging: MessagingPicture,
  leads: LeadsPicture,
  setup: SetupPicture,
  security: SecurityPicture,
  data: DataPicture,
};

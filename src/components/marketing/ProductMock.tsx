// The product, drawn in markup: a gym's admin dashboard in a browser frame
// with a few live-looking events floating around it. No screenshots to go
// stale, and it renders crisp at any size. Everything inside animates in on
// page load, staggered, so the dashboard looks like it is waking up; after
// that it stays alive: the counts run up, a new face checks in now and then,
// and the floating events take turns (globals.css: .a-hero-event).

import { FiActivity, FiBarChart2, FiCalendar, FiCheckCircle, FiCreditCard, FiGrid, FiMessageSquare, FiSettings, FiUsers, FiUserPlus } from "react-icons/fi";
import { stagger } from "@/lib/motion";
import CountUp from "./CountUp";

const BARS = [42, 58, 51, 66, 72, 64, 80, 74, 88, 83, 92, 97];
const CLASSES = [
  { name: "HIIT Blast", time: "06:30", booked: 18, cap: 20, room: "Studio A" },
  { name: "Reformer Pilates", time: "09:00", booked: 10, cap: 12, room: "Studio B" },
  { name: "Boxing Fundamentals", time: "18:00", booked: 24, cap: 24, room: "Main floor" },
];
const CHECKINS = ["AR", "MK", "SJ", "DL", "PT", "+9"];

function Stat({ label, value, delta, index, up = true }: { label: string; value: React.ReactNode; delta: string; index: number; up?: boolean }) {
  return (
    <div className="a-pop rounded-xl border border-gp-edge bg-gp-bone/[0.03] p-3" style={stagger(index)}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-gp-slate">{label}</p>
      <p className="mt-1 font-gp-brand text-lg font-medium text-gp-bone">{value}</p>
      <p className={`mt-0.5 text-[10px] font-semibold ${up ? "text-gp-mint" : "text-rose-400"}`}>{delta}</p>
    </div>
  );
}

function Event({ icon, tint, title, text, className, style, turn }: { icon: React.ReactNode; tint: string; title: string; text: string; className: string; style?: React.CSSProperties; turn: number }) {
  return (
    <div className={`absolute hidden md:block ${className}`} style={style}>
      <div className="a-hero-event flex items-center gap-2.5 rounded-xl border border-gp-edge-2 bg-gp-panel/95 p-3 shadow-2xl shadow-gp-void/60 ring-1 ring-gp-bone/5" style={{ animationDelay: `${0.8 + turn * 3}s` }}>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tint}`}>{icon}</span>
        <div>
          <p className="text-xs font-medium text-gp-bone">{title}</p>
          <p className="text-[11px] text-gp-slate">{text}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProductMock() {
  return (
    <div className="relative mx-auto w-full max-w-[640px] text-left font-gp">
      {/* glow */}
      <div className="absolute -inset-16 -z-10 rounded-[3rem]" style={{ background: "radial-gradient(closest-side, rgb(var(--gp-mint) / 0.14), rgb(var(--gp-ember) / 0.06) 60%, transparent 100%)" }} aria-hidden="true" />

      <div className="overflow-hidden rounded-2xl border border-gp-edge-2 bg-gp-panel/90 shadow-2xl shadow-gp-void/60 ring-1 ring-gp-bone/5">
        {/* browser bar */}
        <div className="flex items-center gap-2 border-b border-gp-edge bg-gp-void/40 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gp-bone/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-gp-bone/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-gp-bone/15" />
          <span className="ml-3 flex-1 rounded-md bg-gp-bone/[0.05] px-3 py-1 text-[11px] text-gp-slate">
            <span className="text-gp-mint">https://</span>ironworks.fit/admin
          </span>
        </div>

        <div className="flex">
          {/* sidebar */}
          <aside className="hidden w-12 flex-col items-center gap-1 border-r border-gp-edge bg-gp-void/30 py-3 sm:flex">
            {[FiGrid, FiUsers, FiCalendar, FiCreditCard, FiMessageSquare, FiBarChart2, FiSettings].map((Icon, i) => (
              <span key={i} className={`a-pop flex h-8 w-8 items-center justify-center rounded-lg ${i === 0 ? "bg-gp-mint/10 text-gp-mint" : "text-gp-slate"}`} style={stagger(i, 200)}>
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </aside>

          <div className="flex-1 p-4">
            <div className="a-rise flex items-center justify-between" style={stagger(2)}>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gp-slate">Iron Works Fitness</p>
                <p className="text-sm font-medium text-gp-bone">Good morning, Aisha</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-gp-mint/10 px-2 py-0.5 text-[10px] font-medium text-gp-mint ring-1 ring-inset ring-gp-mint/30">
                <span className="a-blink mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-gp-mint" aria-hidden="true" />
                <CountUp value={312} duration={1600} />&nbsp;in today
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="Active members" value="1,248" delta="+4.2% this month" index={3} />
              <Stat label="This month" value="Rs 3.74M" delta="+Rs 180k" index={4} />
              <Stat label="Bookings today" value={<CountUp value={186} duration={1600} />} delta="94% capacity" index={5} />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              {/* chart */}
              <div className="a-rise rounded-xl border border-gp-edge bg-gp-bone/[0.03] p-3 sm:col-span-3" style={stagger(6)}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gp-slate">Revenue · 12 months</p>
                  <FiActivity className="h-3.5 w-3.5 text-gp-mint" />
                </div>
                <div className="mt-3 flex h-24 items-end gap-1.5">
                  {BARS.map((h, i) => (
                    <div key={i} className="flex-1 origin-bottom animate-grow rounded-sm bg-gradient-to-t from-gp-mint/25 to-gp-mint" style={{ height: `${h}%`, animationDelay: `${700 + i * 60}ms` }} />
                  ))}
                </div>
              </div>
              {/* check-ins */}
              <div className="a-rise rounded-xl border border-gp-edge bg-gp-bone/[0.03] p-3 sm:col-span-2" style={stagger(7)}>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gp-slate">Checked in now</p>
                <div className="mt-3 flex -space-x-2">
                  {/* Someone new walks in every few seconds. */}
                  <span className="a-wyg-build flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-gp-mint to-gp-ember text-[9px] font-semibold text-gp-ink ring-2 ring-gp-panel" style={{ animationDelay: "2.5s" }}>
                    NA
                  </span>
                  {CHECKINS.map((c, i) => (
                    <span key={c} className={`a-pop flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-semibold ring-2 ring-gp-panel ${i === CHECKINS.length - 1 ? "bg-gp-raised text-gp-mist" : "bg-gp-raised text-gp-bone"}`} style={stagger(i, 900)}>
                      {c}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-gp-slate">
                  Peak <span className="font-medium text-gp-bone">18:00 – 20:00</span>
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gp-bone/10">
                  <div className="a-fill h-full w-[68%] rounded-full bg-gradient-to-r from-gp-mint to-gp-ember" style={stagger(0, 1200)} />
                </div>
              </div>
            </div>

            {/* classes */}
            <div className="a-rise mt-2 rounded-xl border border-gp-edge bg-gp-bone/[0.03] p-3" style={stagger(8)}>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gp-slate">Today&apos;s classes</p>
              <ul className="mt-2 space-y-1.5">
                {CLASSES.map((c, i) => (
                  <li key={c.name} className="a-rise flex items-center gap-3 text-[11px]" style={stagger(i, 900)}>
                    <span className="w-10 font-mono text-gp-slate">{c.time}</span>
                    <span className="flex-1 truncate font-medium text-gp-mist">
                      {c.name} <span className="text-gp-slate">· {c.room}</span>
                    </span>
                    <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-gp-bone/10 sm:block">
                      <span className={`a-fill block h-full rounded-full ${c.booked >= c.cap ? "bg-gp-ember" : "bg-gp-mint"}`} style={{ width: `${(c.booked / c.cap) * 100}%`, ...stagger(i, 1300) }} />
                    </span>
                    <span className={`w-12 text-right font-semibold ${c.booked >= c.cap ? "text-gp-ember" : "text-gp-mist"}`}>
                      {c.booked}/{c.cap}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* floating events: take turns popping up, while they float */}
      <Event turn={0} className="-right-3 top-10 animate-float lg:-right-10" style={{ animationDelay: "0.6s" }} tint="bg-gp-mint/10 text-gp-mint" icon={<FiCheckCircle className="h-4 w-4" />} title="Payment received" text="Sara M. · Unlimited monthly · Rs 5,000" />
      <Event turn={1} className="-left-3 bottom-16 animate-float-slow lg:-left-12" tint="bg-gp-mint/10 text-gp-mint" icon={<FiUserPlus className="h-4 w-4" />} title="New member from the website" text="Signed the waiver · booked HIIT Blast" />
      <Event turn={2} className="-bottom-5 right-8 animate-float" style={{ animationDelay: "1.4s" }} tint="bg-gp-ember/10 text-gp-ember" icon={<FiMessageSquare className="h-4 w-4" />} title="WhatsApp reminder sent" text="Boxing Fundamentals · 24 members" />
    </div>
  );
}

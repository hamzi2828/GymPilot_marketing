import Link from "next/link";
import type { IconType } from "react-icons";
import { FiBarChart2, FiCalendar, FiCreditCard, FiGlobe, FiShield, FiShoppingBag, FiUsers, FiZap } from "react-icons/fi";
import { FEATURE_GROUPS, featuresIn, type GroupKey } from "@/content/features";
import { stagger } from "@/lib/motion";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gp-mint focus-visible:ring-offset-2 focus-visible:ring-offset-gp-void";

// Each group's own colour and icon, for the card look on /features.
const LOOK: Record<GroupKey, { icon: IconType; badge: string; edge: string; glow: string }> = {
  desk: { icon: FiCreditCard, badge: "bg-gp-mint/10 text-gp-mint ring-1 ring-inset ring-gp-mint/30", edge: "from-gp-mint/70", glow: "hover:shadow-gp-mint/10" },
  checkin: { icon: FiZap, badge: "bg-gp-mint/10 text-gp-mint ring-1 ring-inset ring-gp-mint/30", edge: "from-gp-mint/70", glow: "hover:shadow-gp-mint/10" },
  money: { icon: FiBarChart2, badge: "bg-gp-ember/10 text-gp-ember ring-1 ring-inset ring-gp-ember/30", edge: "from-gp-ember/70", glow: "hover:shadow-gp-ember/10" },
  shop: { icon: FiShoppingBag, badge: "bg-gp-ember/10 text-gp-ember ring-1 ring-inset ring-gp-ember/30", edge: "from-gp-ember/70", glow: "hover:shadow-gp-ember/10" },
  classes: { icon: FiCalendar, badge: "bg-gp-mint/10 text-gp-mint ring-1 ring-inset ring-gp-mint/30", edge: "from-gp-mint/70", glow: "hover:shadow-gp-mint/10" },
  team: { icon: FiUsers, badge: "bg-gp-ember/10 text-gp-ember ring-1 ring-inset ring-gp-ember/30", edge: "from-gp-ember/70", glow: "hover:shadow-gp-ember/10" },
  reach: { icon: FiGlobe, badge: "bg-gp-mint/10 text-gp-mint ring-1 ring-inset ring-gp-mint/30", edge: "from-gp-mint/70", glow: "hover:shadow-gp-mint/10" },
  control: { icon: FiShield, badge: "bg-gp-mint/10 text-gp-mint ring-1 ring-inset ring-gp-mint/30", edge: "from-gp-mint/70", glow: "hover:shadow-gp-mint/10" },
};

// Every group, numbered, with how many features it has and each feature under
// it, numbered within its group (1, 1.1, 1.2 … 2, 2.1) -- for a dark
// background. A feature leads to its card on /features (the page slides to
// it); the card's Read more opens the feature's own page. The header's
// Features menu shows the plain list; the top of /features shows the same
// list as a card per group (`variant="cards"`), each in its own colour. The
// groups come in one after another (a-rise), whenever the grid is shown.
export default function FeatureGroupsGrid({ onNavigate, currentPath = "", className = "", variant = "plain" }: { onNavigate?: () => void; currentPath?: string; className?: string; variant?: "plain" | "cards" }) {
  const cards = variant === "cards";
  return (
    <div className={`grid sm:grid-cols-2 lg:grid-cols-4 ${cards ? "gap-4" : "gap-x-8 gap-y-8"} ${className}`}>
      {FEATURE_GROUPS.map((group, gi) => {
        const items = featuresIn(group.key);
        const look = LOOK[group.key];
        const Icon = look.icon;
        return (
          <div
            key={group.key}
            className={`a-rise ${cards ? `group/card relative overflow-hidden rounded-[20px] border border-gp-edge bg-gp-graphite p-4 font-gp shadow-lg shadow-black/20 transition-all duration-500 hover:-translate-y-1 hover:border-gp-edge-2 hover:bg-gp-panel hover:shadow-2xl ${look.glow} motion-reduce:transition-none motion-reduce:hover:translate-y-0` : ""}`}
            style={stagger(gi)}
          >
            {/* A thin line in the group's colour across the top of its card. */}
            {cards && <span className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${look.edge} via-gp-bone/20 to-transparent`} aria-hidden="true" />}
            <Link href={`/features#${group.key}`} onClick={onNavigate} className={`group/head flex items-center gap-3 rounded-xl transition-colors ${cards ? "" : "-mx-2 px-2 py-1.5 hover:bg-gp-bone/5"} ${FOCUS}`}>
              {cards ? (
                <span className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${look.badge} transition-transform duration-300 group-hover/card:-rotate-6 group-hover/card:scale-110 motion-reduce:transition-none`}>
                  <Icon className="h-5 w-5" />
                  <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gp-void text-[10px] font-medium text-gp-bone ring-1 ring-gp-edge-2">{gi + 1}</span>
                </span>
              ) : (
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gp-bone/10 text-[11px] font-medium text-gp-mist transition-colors group-hover/head:bg-gp-bone group-hover/head:text-gp-ink">{gi + 1}</span>
              )}
              <span className="min-w-0 flex-1">
                <span className={`block font-medium leading-snug tracking-[-0.01em] text-gp-bone ${cards ? "text-[15px]" : "text-sm"}`}>{group.label}</span>
                {cards ? (
                  <span className="mt-0.5 inline-block rounded-full bg-gp-bone/[0.06] px-2 py-px text-[10px] font-medium text-gp-mist">{items.length} features</span>
                ) : (
                  <span className="block text-[11px] text-gp-slate">{items.length} features</span>
                )}
              </span>
            </Link>
            <ul className={`space-y-0.5 ${cards ? "mt-3 border-t border-gp-edge pt-2" : "ml-[22px] mt-2 border-l border-gp-edge pl-3"}`}>
              {items.map((f, fi) => {
                const here = currentPath === `/features/${f.slug}`;
                return (
                  <li key={f.key}>
                    <Link
                      href={`/features#${f.slug}`}
                      onClick={onNavigate}
                      aria-current={here ? "page" : undefined}
                      className={`group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${FOCUS} ${here ? "bg-gp-bone/10 text-gp-bone" : "text-gp-mist hover:bg-gp-bone/5 hover:text-gp-bone"}`}
                    >
                      <span className="w-7 shrink-0 font-mono text-[11px] font-medium tabular-nums text-gp-slate transition-colors group-hover:text-gp-mint">
                        {gi + 1}.{fi + 1}
                      </span>
                      <span className="min-w-0 flex-1">{f.name}</span>
                      {cards && <span className="text-gp-slate opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-gp-mint group-hover:opacity-100" aria-hidden="true">→</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

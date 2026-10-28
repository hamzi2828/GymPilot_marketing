import Link from "next/link";
import { FaHandPointLeft, FaHandPointRight } from "react-icons/fa";
import { BENEFITS } from "@/content/site";

// The one way on to /features, wherever it appears: a hand on each side
// nudging towards the words, a ring pulsing round it, a shine sweeping across,
// and a bouncy entrance when it is revealed. `revealed` is for a button inside
// a <Reveal> (it pops in when it scrolls into view); without it the button pops
// in whenever it is shown, as in the header's menus. Everything holds still
// for anyone who has asked for reduced motion.
export default function ViewAllFeaturesButton({ size = "md", count, revealed = false, onClick, className = "", ...rest }: { size?: "md" | "lg"; count?: number; revealed?: boolean; onClick?: () => void; className?: string; "aria-current"?: "page" }) {
  const big = size === "lg";
  return (
    <span className={`relative inline-flex ${revealed ? "v-cta-in" : "a-cta-in"} ${className}`}>
      <span className="a-ping-ring pointer-events-none absolute inset-0 rounded-xl bg-gp-mint/25" aria-hidden="true" />
      <Link
        href="/features"
        onClick={onClick}
        {...rest}
        className={`btn-sweep group relative inline-flex w-full items-center justify-center rounded-xl gp-btn-dark border border-gp-edge-2 font-medium text-gp-bone transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gp-mint focus-visible:ring-offset-2 focus-visible:ring-offset-gp-void motion-reduce:transition-none ${big ? "h-14 gap-3 px-8 text-base" : "h-[38px] gap-2.5 px-5 text-sm"}`}
      >
        <FaHandPointRight className={`a-point-r shrink-0 text-gp-ember ${big ? "h-5 w-5" : "h-4 w-4"}`} aria-hidden="true" />
        <span>
          {BENEFITS.cta}
          {count ? ` (${count})` : ""}
        </span>
        <FaHandPointLeft className={`a-point-l shrink-0 text-gp-ember ${big ? "h-5 w-5" : "h-4 w-4"}`} aria-hidden="true" />
      </Link>
    </span>
  );
}

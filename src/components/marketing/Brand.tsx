import Link from "next/link";
import { SITE } from "@/content/site";

// The super-admin panel's square mark. The public website uses the
// wordmark below instead.
export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className={`a-pop inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 text-white shadow-lg shadow-brand-500/30 ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="currentColor">
        <path d="M3 10h2v4H3v-4Zm16 0h2v4h-2v-4ZM6 8h2v8H6V8Zm10 0h2v8h-2V8Zm-7 3h6v2H9v-2Z" />
      </svg>
    </span>
  );
}

// "G" built from three blocks, the crossbar lit mint to amber. The blocks
// use currentColor, so the mark follows the text colour in light and dark.
export function GMark({ className = "mk" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="gp-mark-bar" x1="18" y1="0" x2="38" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7FE3D2" />
          <stop offset="1" stopColor="#E5A34A" />
        </linearGradient>
      </defs>
      <g fill="currentColor">
        <path d="M2 18V12A10 10 0 0 1 12 2H38V10H14A4 4 0 0 0 10 14V18Z" />
        <path d="M2 22H10V26A4 4 0 0 0 14 30H26A4 4 0 0 0 30 26V22H38V28A10 10 0 0 1 28 38H12A10 10 0 0 1 2 28Z" />
        <path d="M18 13H38V19H18Z" fill="url(#gp-mark-bar)" />
      </g>
    </svg>
  );
}

/** The wordmark: the G mark, "gymspılot" in Tektur with a mint dot on the i, then a boxed PRO. */
export function Wordmark({ className = "", mark = true, light = false }: { className?: string; mark?: boolean; light?: boolean }) {
  return (
    <span className={`gp-logo ${light ? "on-light" : ""} ${className}`}>
      {mark && <GMark />}
      <span aria-hidden="true">
        gymsp<span className="i">ı</span>lot
      </span>
      <span className="pro" aria-hidden="true">PRO</span>
    </span>
  );
}

export default function Brand({ dark = true, href = "/", className = "" }: { dark?: boolean; href?: string; className?: string }) {
  return (
    <Link href={href} className={`group inline-flex items-center ${className}`} aria-label={`${SITE.name} home`}>
      <Wordmark light={!dark} className="transition-opacity duration-300 group-hover:opacity-85" />
    </Link>
  );
}

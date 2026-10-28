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

// The dumbbell mark (the original GymsPilotPro icon) on a rounded tile lit
// mint to amber. Fixed colours, so it reads the same in light and dark.
export function GMark({ className = "mk" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="gp-mark-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7FE3D2" />
          <stop offset="1" stopColor="#E5A34A" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#gp-mark-tile)" />
      <path fill="#050707" d="M10 26h5v12h-5zM49 26h5v12h-5zM17 21h6v22h-6zM41 21h6v22h-6zM23 29h18v6H23z" />
    </svg>
  );
}

/** The wordmark: the dumbbell mark, "gymspılot" in Tektur with a mint dot on the i, then a boxed PRO. */
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

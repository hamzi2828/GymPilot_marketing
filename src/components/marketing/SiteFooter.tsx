import Link from "next/link";
import { FiChevronUp } from "react-icons/fi";
import Brand from "./Brand";
import FooterWordmark from "./FooterWordmark";
import ContactLinks from "./ContactLinks";
import FullPageLink from "@/components/FullPageLink";
import { FOOTER, HERO, LEGAL, SITE } from "@/content/site";

// A column link: a short mint line slides in before it on hover (reference .fgrid).
const COL_LINK = "group inline-flex items-center transition-colors hover:text-gp-bone";
const DASH = <span className="h-[1.5px] w-0 bg-gp-mint transition-[width,margin] duration-500 ease-[cubic-bezier(.34,1.45,.64,1)] group-hover:mr-2 group-hover:w-3 motion-reduce:transition-none" aria-hidden="true" />;
// A bottom-row link: a mint underline draws in from the left.
const BOT_LINK = "relative after:absolute after:inset-x-0 after:-bottom-[3px] after:h-px after:origin-right after:scale-x-0 after:bg-gp-mint after:transition-transform after:duration-500 hover:text-gp-bone hover:after:origin-left hover:after:scale-x-100 motion-reduce:after:transition-none";

export default function SiteFooter() {
  return (
    <footer className="relative mt-[110px] overflow-hidden border-t border-gp-edge pt-14 font-gp text-gp-slate sm:mt-[150px]">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <div className="mb-11 flex flex-wrap items-center justify-between gap-4 border-b border-gp-edge pb-7">
          <p className="max-w-[560px] text-[clamp(20px,2.4vw,28px)] font-medium tracking-[-0.03em] text-gp-bone">
            {HERO.title.join(" ")} <span className="text-gp-slate">Set up within a day.</span>
          </p>
          <a href="#top" className="group inline-flex h-10 items-center gap-2 rounded-full border border-gp-edge-2 pl-4 pr-3.5 text-[13.5px] text-gp-mist transition-[color,border-color,transform] duration-500 hover:-translate-y-0.5 hover:border-gp-mint hover:text-gp-bone motion-reduce:transition-none">
            <FiChevronUp className="h-[15px] w-[15px] transition-transform duration-500 group-hover:-translate-y-[3px]" aria-hidden="true" /> Back to top
          </a>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
          <div className="min-w-0">
            <Brand />
            <p className="mt-3.5 max-w-[290px] text-[14.5px] leading-relaxed">{FOOTER.blurb}</p>
            {/* WhatsApp, email and phone when set. The contact form, which is
                always there, is in the "For gyms" column. */}
            <ContactLinks form={false} className="mt-5" />
          </div>
          {FOOTER.columns.map((col) => (
            <div key={col.title} className="min-w-0">
              <p className="mb-3.5 text-sm font-medium text-gp-bone">{col.title}</p>
              {col.note && <p className="mb-3 max-w-[290px] text-[14.5px] leading-relaxed">{col.note}</p>}
              <ul className="grid gap-[9px] text-[14.5px]">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    {/* A section of the landing page is reachable from every
                        page, so its link always carries the leading slash. */}
                    <Link href={l.href.startsWith("#") ? `/${l.href}` : l.href} className={COL_LINK}>
                      {DASH}
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap justify-between gap-4 text-[13px]">
          <p>
            © {new Date().getFullYear()} {LEGAL.name || SITE.name}. All rights reserved.
          </p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-[18px] gap-y-2">
              {FOOTER.legal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={BOT_LINK}>
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                {/* The platform's sign-in opens as a page of its own, under the
                    panel's stricter policy, not inside this one with its
                    analytics still running. */}
                <FullPageLink href={FOOTER.platform.href} className={`text-gp-slate/70 ${BOT_LINK}`}>
                  {FOOTER.platform.label}
                </FullPageLink>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* The giant wordmark along the bottom edge; its letters light up and lift near the pointer. */}
      <FooterWordmark />
    </footer>
  );
}

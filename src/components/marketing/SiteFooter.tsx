import Link from "next/link";
import Brand from "./Brand";
import ContactLinks from "./ContactLinks";
import FullPageLink from "@/components/FullPageLink";
import { FOOTER, LEGAL, SITE } from "@/content/site";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Brand />
            <p className="mt-4 max-w-sm text-sm leading-relaxed">{FOOTER.blurb}</p>
            {/* WhatsApp, email and phone when set. The contact form, which is
                always there, is in the "For gyms" column. */}
            <ContactLinks form={false} className="mt-5" />
          </div>
          {FOOTER.columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{col.title}</p>
              {col.note && <p className="mt-4 text-sm leading-relaxed">{col.note}</p>}
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    {/* A section of the landing page is reachable from every
                        page, so its link always carries the leading slash. */}
                    <Link href={l.href.startsWith("#") ? `/${l.href}` : l.href} className="hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {LEGAL.name || SITE.name}. All rights reserved.
          </p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {FOOTER.legal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                {/* The platform's sign-in opens as a page of its own, under the
                    panel's stricter policy, not inside this one with its
                    analytics still running. */}
                <FullPageLink href={FOOTER.platform.href} className="text-slate-600 hover:text-slate-300">
                  {FOOTER.platform.label}
                </FullPageLink>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

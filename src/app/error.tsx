"use client";

// What a visitor sees when a page breaks while it is being shown. It offers
// another go, the way home, and every way to reach us -- never a blank
// screen. Self-contained on purpose: it draws no header or footer, so it
// still works if one of those is what broke.

import { useEffect } from "react";
import Link from "next/link";
import { FiAlertTriangle, FiArrowRight, FiRefreshCw } from "react-icons/fi";
import Brand from "@/components/marketing/Brand";
import ContactLinks from "@/components/marketing/ContactLinks";
import Glow from "@/components/marketing/Glow";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // For whoever is looking at the browser's console; nothing is sent anywhere.
    console.error(error);
  }, [error]);

  return (
    <main className="gp-site relative min-h-screen overflow-hidden bg-gp-void px-5 py-10 font-gp text-gp-bone sm:px-8">
      <div className="bg-grid-dark absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_70%)]" aria-hidden="true" />
      <Glow className="left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 -translate-y-1/3" color="rgb(var(--gp-ember) / 0.14)" drift="a" />
      <div className="relative mx-auto max-w-xl">
        <Brand />
        <div className="mt-20 text-center sm:mt-28" role="alert">
          <span className="a-pop mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gp-ember/10 text-gp-ember ring-1 ring-inset ring-gp-ember/30">
            <FiAlertTriangle className="h-8 w-8" />
          </span>
          <h1 className="gp-shine mt-6 pb-1 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">Something went wrong</h1>
          <p className="mt-4 text-lg leading-relaxed text-gp-slate">This page did not load properly. It is our fault, not yours. Please try again.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gp-bone px-[22px] text-[15px] font-medium text-gp-ink transition-transform duration-300 hover:-translate-y-0.5"
            >
              <FiRefreshCw className="h-4 w-4" /> Try again
            </button>
            <Link href="/" className="inline-flex h-12 items-center gap-2 rounded-xl px-5 text-[15px] font-medium text-gp-mist transition-colors hover:text-gp-bone">
              Go to the home page <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-10 text-sm text-gp-slate">Still stuck? Tell us.</p>
          <ContactLinks layout="row" className="mt-3" />
        </div>
      </div>
    </main>
  );
}

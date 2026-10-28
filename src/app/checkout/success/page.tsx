import type { Metadata } from "next";
import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export const metadata: Metadata = {
  title: "Setting up your gym",
  description: "Your payment is confirmed and your gym is being set up.",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    // useSearchParams needs a boundary; the signup is read from ?signup=.
    <Suspense fallback={<div className="gp-site min-h-screen bg-gp-void" />}>
      <SuccessClient />
    </Suspense>
  );
}

import type { Metadata } from "next";
import SiteHeader from "@/components/marketing/SiteHeader";
import Hero from "@/components/marketing/Hero";
import ConvergeHeadline from "@/components/marketing/ConvergeHeadline";
import GymPulse from "@/components/marketing/GymPulse";
import FeatureOrbit from "@/components/marketing/FeatureOrbit";
import Benefits from "@/components/marketing/Benefits";
import WhatYouGet from "@/components/marketing/WhatYouGet";
import HowItWorks from "@/components/marketing/HowItWorks";
import Suggestions from "@/components/marketing/Suggestions";
import Pricing from "@/components/marketing/Pricing";
import Testimonials from "@/components/marketing/Testimonials";
import Faq from "@/components/marketing/Faq";
import DemoForm from "@/components/marketing/DemoForm";
import SiteFooter from "@/components/marketing/SiteFooter";
import JsonLd from "@/components/marketing/JsonLd";
import ScrollProgress from "@/components/marketing/ScrollProgress";
import LogoIntro from "@/components/marketing/LogoIntro";

// The landing page is "/" whatever a link to it carried (?utm_source=…).
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Written for a gym owner who has never heard of us: what it does for them,
// what they get, how they start, that their ideas are built free, what it
// costs, and how to talk to us. The detail of each feature is on /features,
// not here.
export default function LandingPage() {
  return (
    <>
      <JsonLd />
      <LogoIntro />
      <SiteHeader />
      <main>
        <Hero />
        <ConvergeHeadline />
        <GymPulse />
        <Benefits />
        <WhatYouGet />
        <FeatureOrbit />
        <HowItWorks />
        <Suggestions />
        <Pricing />
        <Testimonials />
        <Faq />
        <DemoForm />
      </main>
      <SiteFooter />
      <ScrollProgress />
    </>
  );
}

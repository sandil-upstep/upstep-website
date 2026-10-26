import type { Metadata } from "next";
import CubeParallax from "@/components/CubeParallax";
import { GapProvider } from "@/components/gap/GapContext";
import GapClosing from "@/components/gap/GapClosing";
import GapFees from "@/components/gap/GapFees";
// import GapHero from "@/components/gap/GapHero"; // hidden: replaced by GapParallaxHero
import GapParallaxHero from "@/components/gap/GapParallaxHero";
import GapOutcome from "@/components/gap/GapOutcome";
import GapPreview from "@/components/gap/GapPreview";
import GapProgram from "@/components/gap/GapProgram";
import GapRegister from "@/components/gap/GapRegister";
import GapRegisterPill from "@/components/gap/GapRegisterPill";
import GapSchedule from "@/components/gap/GapSchedule";

export const metadata: Metadata = {
  title: "Grandmaster Accelerator Program (GAP) · Upstep Academy",
  description:
    "A year of live, GM-led chess training for competitive players rated 1400–1800, built to add 250+ FIDE points in 12 months.",
};

// The Grandmaster Accelerator Program, linked from the header's GAP badge.
// The sections share the time zone, batch, currency and the registration
// drawer through GapProvider. The pill and the drawer sit outside <main>,
// whose containment would otherwise pin them to the page, not the window.
export default function GapPage() {
  return (
    <GapProvider>
      <main className="gap flex-1">
        {/* <GapHero /> */}
        <GapParallaxHero />
        <GapPreview />
        <GapProgram />
        <GapOutcome />
        <GapSchedule />
        <GapFees />
        <GapClosing />
      </main>
      <GapRegisterPill />
      <GapRegister />
      <CubeParallax />
    </GapProvider>
  );
}

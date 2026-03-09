import { Navbar } from "@/components/navigation";
import { Hero } from "@/components/landing/hero";
import { PhaseBuild } from "@/components/landing/phase-build";
import { PhaseMissions } from "@/components/landing/phase-missions";
import { JourneyConnector } from "@/components/landing/journey-connector";
import { JourneyTimeline } from "@/components/landing/journey-timeline";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { IndustryProvider } from "@/components/landing/industry-context";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="landing" />
      <IndustryProvider>
        {/* Sticky Journey Timeline */}
        <JourneyTimeline />

        <main>
          {/* Phase 1: DEFINE - Identity Core */}
          <section id="phase-define">
            <Hero />
          </section>

          {/* Connector: Define → Build */}
          <JourneyConnector
            from="define"
            to="build"
            message="Your identity fuels everything"
          />

          {/* Phase 2: BUILD - Agents */}
          <section id="phase-build">
            <PhaseBuild />
          </section>

          {/* Connector: Build → Scale */}
          <JourneyConnector
            from="build"
            to="scale"
            message="From agent to party"
          />

          {/* Phase 3: SCALE - Missions */}
          <section id="phase-scale">
            <PhaseMissions />
          </section>

          {/* CTA */}
          <CTASection />
        </main>
      </IndustryProvider>
      <Footer />
    </div>
  );
}

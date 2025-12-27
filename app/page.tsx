import { Navbar } from "@/components/navigation";
import { Hero } from "@/components/landing/hero";
import { PhaseRoleplAIrs } from "@/components/landing/phase-roleplaairs";
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
          {/* Phase 1: START - Identity Core */}
          <section id="phase-start">
            <Hero />
          </section>

          {/* Connector: Identity → RoleplAIrs */}
          <JourneyConnector
            from="identity"
            to="roleplaairs"
            message="Now you're ready to specialize"
          />

          {/* Phase 2: GROW - RoleplAIrs */}
          <section id="phase-grow">
            <PhaseRoleplAIrs />
          </section>

          {/* Connector: RoleplAIrs → Missions */}
          <JourneyConnector
            from="roleplaairs"
            to="missions"
            message="Now you're ready to scale"
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

import { Navigation } from "@/components/landing/navigation";
import { Hero } from "@/components/landing/hero";
import { TrustBar } from "@/components/landing/trust-bar";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeatureCards } from "@/components/landing/feature-cards";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <Hero />
        <TrustBar />
        <HowItWorks />
        <FeatureCards />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

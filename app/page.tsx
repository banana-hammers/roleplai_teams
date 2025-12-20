import { Navbar } from "@/components/navigation";
import { Hero } from "@/components/landing/hero";
import { Anatomy } from "@/components/landing/anatomy";
import { Missions } from "@/components/landing/missions";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { IndustryProvider } from "@/components/landing/industry-context";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="landing" />
      <IndustryProvider>
        <main>
          <Hero />
          <Anatomy />
          <Missions />
          <CTASection />
        </main>
      </IndustryProvider>
      <Footer />
    </div>
  );
}

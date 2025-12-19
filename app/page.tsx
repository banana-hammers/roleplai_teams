import { Navbar } from "@/components/navigation";
import { Hero } from "@/components/landing/hero";
import { ConversationalFlow } from "@/components/landing/conversational-flow";
import { Anatomy } from "@/components/landing/anatomy";
import { Missions } from "@/components/landing/missions";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="landing" />
      <main>
        <Hero />
        <ConversationalFlow />
        <Anatomy />
        <Missions />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

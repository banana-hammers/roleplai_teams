import { Navigation } from "@/components/landing/navigation";
import { Hero } from "@/components/landing/hero";
import { ConversationalFlow } from "@/components/landing/conversational-flow";
import { Anatomy } from "@/components/landing/anatomy";
import { LevelUp } from "@/components/landing/level-up";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <Hero />
        <ConversationalFlow />
        <Anatomy />
        <LevelUp />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

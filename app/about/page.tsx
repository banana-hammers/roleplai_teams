import Link from "next/link";
import { Navbar } from "@/components/navigation";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Fingerprint,
  Trash2,
  TrendingUp,
  Monitor,
  Cloud,
  Bot,
} from "lucide-react";

export const metadata = {
  title: "About | Roleplai Teams",
  description:
    "80+ years building products that work. We cut through AI hype to build technology that elevates what humans can do.",
};

const eras = [
  {
    icon: Monitor,
    era: "Computers",
    decade: "1980s",
    description: "One person could produce professional work that once required entire departments",
  },
  {
    icon: Cloud,
    era: "SaaS",
    decade: "2000s",
    description: "Distributed teams could collaborate in real-time with tools once reserved for enterprises",
  },
  {
    icon: Bot,
    era: "AI Agents",
    decade: "Now",
    description: "You can delegate open-ended work to AI that carries your voice and judgment",
  },
];

const pillars = [
  {
    icon: Fingerprint,
    title: "Your Voice, Amplified",
    description:
      "RoleplAIrs carry your expertise and values into every interaction. No more generic AI outputs that sound like everyone else.",
  },
  {
    icon: TrendingUp,
    title: "Evolve How You Work",
    description:
      "Technology should fit your workflow, not the other way around. RoleplAIrs learn your patterns and adapt to how your team actually operates.",
  },
  {
    icon: Trash2,
    title: "Focus on What Matters",
    description:
      "The tedious disappears. You spend time on meaningful, creative work — the parts of your job that drew you here in the first place.",
  },
];

const team = [
  {
    name: "Ryan Eves",
    role: "Chief Executive Officer",
    classTitle: "The Bard",
    bio: "Nearly 20 years in product and design. Built products at startups and enterprises alike. Believes the best software feels effortless.",
  },
  {
    name: "Anthony Charles",
    role: "Chief Technology Officer",
    classTitle: "The Artificer",
    bio: "30+ years building intuitive products. Seen every technology hype cycle and knows what actually works.",
  },
  {
    name: "Rob Bauman",
    role: "Chief Operating Officer",
    classTitle: "The Paladin",
    bio: "22+ years in operations. Former EA.com global lead who scaled systems that actually ship.",
  },
  {
    name: "Thomas Levi",
    role: "Chief Data Scientist",
    classTitle: "The Sorcerer",
    bio: "ML expert and former physicist. Cuts through AI hype with rigorous, practical approaches.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="landing" />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />

          <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Technology Has Always{" "}
              <span className="bg-gradient-to-r from-primary via-indigo-400 to-accent bg-clip-text text-transparent">
                Elevated
              </span>{" "}
              What Humans Can Do
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              From computers to SaaS to AI — each era amplified human
              capabilities. We&apos;re building the next chapter: computers that
              think on your behalf and handle the open-ended work.
            </p>
          </div>
        </section>

        {/* Evolution Timeline */}
        <section className="border-y border-border/40 bg-muted/20 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 md:grid-cols-3">
              {eras.map((era, index) => (
                <div
                  key={era.era}
                  className="relative rounded-xl border border-border/50 bg-card p-6 text-center"
                >
                  {index < eras.length - 1 && (
                    <div className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 md:block">
                      <ArrowRight className="size-6 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                    <era.icon className="size-7 text-primary" />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {era.decade}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">{era.era}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {era.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Real Problem */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                The Problem With Most AI Tools
              </h2>
              <p className="mt-2 text-xl font-medium text-primary">
                They Create More Work, Not Less
              </p>
            </div>

            <div className="mt-12 rounded-xl border border-border/50 bg-card p-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    <span className="font-medium text-foreground">They generate slop</span> — generic outputs that sound like everyone else and require constant editing.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    <span className="font-medium text-foreground">They replace human judgment</span> instead of enhancing it. You end up reviewing AI work instead of doing meaningful work.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    <span className="font-medium text-foreground">They don&apos;t understand your context</span> — your voice, your standards, how your team actually operates.
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-border/50 pt-6">
                <p className="text-lg font-medium text-foreground">
                  We built RoleplAIrs differently. AI that learns YOUR voice, YOUR workflows, YOUR standards — and gets better the more you use it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Philosophy */}
        <section className="border-y border-border/40 bg-muted/20 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                What We Believe
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                The &ldquo;yes, and...&rdquo; culture that makes collaboration magical is the same spirit behind the Agile Manifesto: individuals and interactions over processes and tools. That&apos;s how we build.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-3">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="text-center">
                  <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                    <pillar.icon className="size-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{pillar.title}</h3>
                  <p className="mt-3 text-muted-foreground">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Vision */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Why We&apos;re Building This
              </h2>
              <p className="mx-auto mt-8 max-w-3xl text-xl text-muted-foreground">
                We&apos;ve watched AI hype cycles come and go. We know what lasts: technology that makes humans more capable, not less relevant.
              </p>
              <p className="mx-auto mt-6 max-w-3xl text-xl font-medium text-foreground">
                RoleplAIrs are AI agents that think on your behalf — handling open-ended tasks while carrying your voice, your expertise, and your standards. Technology doing what it was always meant to do.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="border-y border-border/40 bg-muted/20 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                The Team
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                80+ combined years building products that work. We&apos;ve seen every hype cycle and learned what actually matters: technology that elevates humans.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((member) => (
                <div
                  key={member.name}
                  className="rounded-xl border border-border/50 bg-card p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                    <span className="text-2xl font-bold text-primary">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <p className="text-sm font-medium text-primary">
                    {member.role}
                  </p>
                  <p className="mt-1 text-xs italic text-muted-foreground/70">
                    {member.classTitle}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {member.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-accent/10" />

          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to Elevate Your Team?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Meet Nova, your AI guide. In 5 minutes, capture your voice and start building AI that actually sounds like you.
            </p>
            <div className="mt-8">
              <Button asChild variant="gradient" size="lg" className="gap-2">
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

import Link from "next/link";
import { Navbar } from "@/components/navigation";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Fingerprint,
  MapPin,
  Monitor,
  Cloud,
  Bot,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "About | RoleplAI Teams — AI for Canadian SaaS Startups",
  description:
    "Built in Canada for scaling SaaS teams. RoleplAI Teams gives early-stage startups AI agents that carry their voice and expertise — so lean teams ship like large ones.",
};

const eras = [
  {
    icon: Monitor,
    era: "Computers",
    decade: "1980s",
    description:
      "A solo founder could produce professional work that once required an entire department",
  },
  {
    icon: Cloud,
    era: "SaaS",
    decade: "2000s",
    description:
      "Startups could compete with enterprises using the same tools at a fraction of the cost",
  },
  {
    icon: Bot,
    era: "AI Agents",
    decade: "Now",
    description:
      "A lean startup team can delegate open-ended work to AI that carries their brand voice and domain expertise",
  },
];

const pillars = [
  {
    icon: Fingerprint,
    title: "Brand Voice at Scale",
    description:
      "Every RoleplAIr carries the startup's unique voice. Customer support, sales outreach, and content stay on-brand without a review loop.",
  },
  {
    icon: TrendingUp,
    title: "Ship More With Less",
    description:
      "A 5-person startup gets the output velocity of a much larger team. RoleplAIrs handle drafting, research, customer responses — so founders focus on strategy.",
  },
  {
    icon: Zap,
    title: "Compound Over Time",
    description:
      "Unlike prompt-and-pray tools, RoleplAIrs improve as the team uses them. Skills, lore, and identity build up into a durable knowledge asset.",
  },
];

const canadianPoints = [
  {
    icon: MapPin,
    title: "Canadian-Founded, Canadian-Hosted",
    description:
      "Data residency and privacy compliance matter. Built by a Canadian team that understands PIPEDA and provincial privacy requirements.",
  },
  {
    icon: Users,
    title: "Designed for Lean Teams",
    description:
      "Purpose-built for the 3–15 person SaaS companies that make up incubator cohorts. Not enterprise bloatware scaled down.",
  },
  {
    icon: Shield,
    title: "BYO API Keys, Control Costs",
    description:
      "Startups bring their own AI provider keys and control costs directly. No hidden markup on API calls.",
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
              Give Every Portfolio Company a{" "}
              <span className="bg-linear-to-r from-primary via-indigo-400 to-accent bg-clip-text text-transparent">
                10x Team
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Your startups are hiring cautiously and shipping fast. RoleplAI
              Teams gives lean SaaS teams AI agents that carry their
              founders&apos; voice and expertise — so a team of 5 operates like
              a team of 50.
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
                Your Startups Tried AI. Here&apos;s Why It Didn&apos;t Stick.
              </h2>
              <p className="mt-2 text-xl font-medium text-primary">
                Generic Tools Create More Work for Lean Teams
              </p>
            </div>

            <div className="mt-12 rounded-xl border border-border/50 bg-card p-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Generic outputs dilute brand
                    </span>{" "}
                    — AI-generated content strips away the differentiation
                    startups worked hard to build.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Founders become AI editors
                    </span>{" "}
                    — Instead of building product and closing deals, founders
                    spend hours fixing AI output.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Zero context about the business
                    </span>{" "}
                    — Off-the-shelf AI doesn&apos;t know the startup&apos;s ICP,
                    tone, or competitive landscape.
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-border/50 pt-6">
                <p className="text-lg font-medium text-foreground">
                  RoleplAI Teams is different. Each startup creates AI agents
                  that learn their voice, their market, and their workflows —
                  and get better over time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Incubators Choose RoleplAI Teams */}
        <section className="border-y border-border/40 bg-muted/20 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Why Incubators Choose RoleplAI Teams
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                Your portfolio companies need tools that deliver ROI in weeks,
                not months. Here&apos;s what we&apos;ve built for them.
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

        {/* Built for the Canadian SaaS Ecosystem */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Built for the Canadian SaaS Ecosystem
              </h2>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {canadianPoints.map((point) => (
                <div
                  key={point.title}
                  className="relative rounded-xl border border-border/50 bg-card p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                    <point.icon className="size-7 text-primary" />
                  </div>
                  <h3 className="mt-1 text-xl font-semibold">{point.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {point.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why We're Building This */}
        <section className="border-y border-border/40 bg-muted/20 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Why We&apos;re Building This
              </h2>
              <p className="mx-auto mt-8 max-w-3xl text-xl text-muted-foreground">
                We&apos;ve spent 80+ combined years building products at
                startups and enterprises. We know what scales: technology that
                makes small teams dangerous, not tools that require a small team
                just to manage them.
              </p>
              <p className="mx-auto mt-6 max-w-3xl text-xl font-medium text-foreground">
                RoleplAI Teams is the AI platform we wish existed when we were
                scaling our own companies. AI agents that carry your
                founders&apos; judgment, learn your startups&apos; domains, and
                compound in value — not another chatbot with a blank prompt.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                The Team
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                A Canadian founding team with 80+ combined years building
                products that ship. We&apos;ve scaled systems at EA, led product
                at startups and enterprises, and published ML research. We know
                what hype looks like — and what works.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((member) => (
                <div
                  key={member.name}
                  className="rounded-xl border border-border/50 bg-card p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-accent/20">
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
          <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/10 via-background to-accent/10" />

          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Let&apos;s Talk About Your Portfolio
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We partner with incubators to roll out RoleplAI Teams across
              cohorts. Book a call to see how your startups can ship faster with
              AI agents that actually know their business.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button asChild variant="gradient" size="lg" className="gap-2">
                <Link href="/contact">
                  Book a Demo
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/signup">Try It Free</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

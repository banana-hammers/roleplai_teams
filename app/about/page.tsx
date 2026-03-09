import Link from "next/link";
import { Navbar } from "@/components/navigation";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  Eye,
  Layers,
  Leaf,
  MapPin,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

export const metadata = {
  title: "About | Lorebound — Our Story",
  description:
    "Four founders with 80+ combined years shipping products at EA, Unbounce, FullStory, and the Canadian Forces. We built the AI identity platform we always needed.",
};

const observations = [
  {
    icon: Eye,
    insight: "Identity resets every session",
    detail:
      "We watched teams paste the same brand voice guide into ChatGPT hundreds of times. The AI never remembered who it was working for — so every interaction started from zero.",
  },
  {
    icon: Layers,
    insight: "Knowledge doesn't compound",
    detail:
      "At EA, Unbounce, and FullStory, we built institutional knowledge over years. Generic AI tools throw that away between sessions. There's no continuity, no growth.",
  },
  {
    icon: BookOpen,
    insight: "Small teams pay the highest price",
    detail:
      "Enterprise teams can hire prompt engineers. A 5-person startup can't. The teams that need AI leverage the most are the ones worst served by today's tools.",
  },
];

const beliefs = [
  {
    icon: Sparkles,
    title: "Identity is infrastructure",
    description:
      "An AI agent without persistent identity is just autocomplete. Voice, boundaries, and domain knowledge should be first-class — stored, versioned, and present in every interaction.",
  },
  {
    icon: Users,
    title: "Teams deserve compounding returns",
    description:
      "Every skill taught, every piece of lore added, every refinement to an agent's personality should make the whole team more capable. AI should build equity, not burn hours.",
  },
  {
    icon: Shield,
    title: "Ship reliably or don't ship",
    description:
      "We've run websites serving tens of millions of users and led soldiers in disaster response. We build with the rigor those roles demand — not move-fast-and-break-things.",
  },
];

const canadianPoints = [
  {
    icon: MapPin,
    title: "Canadian-Founded, Canadian-Hosted",
    description:
      "Data residency and privacy compliance matter. Built by a team that understands PIPEDA and provincial privacy requirements firsthand.",
  },
  {
    icon: Users,
    title: "Built for Growing Teams",
    description:
      "Purpose-built for the lean SaaS companies scaling from 3 to 50 people. Not enterprise bloatware scaled down.",
  },
  {
    icon: Shield,
    title: "BYO API Keys, No Markup",
    description:
      "Bring your own AI provider keys and control costs directly. Transparent pricing, no hidden margins on API calls.",
  },
];

const team = [
  {
    name: "Ryan Eves",
    role: "Chief Executive Officer",
    classTitle: "The Bard",
    bio: "15+ years in product and UX leadership. Led Unbounce's evolution to an AI/ML platform and designed EA's Network Design System. Teaches product strategy and builds things that feel effortless.",
  },
  {
    name: "Anthony Charles",
    role: "Chief Technology Officer",
    classTitle: "The Artificer",
    bio: "30+ years building for the web. Software Engineering Manager at EA leading the team behind ea.com. Built game analytics visualization tools and taught web technologies at BCIT for 16 years.",
  },
  {
    name: "Rob Bauman",
    role: "Chief Operating Officer",
    classTitle: "The Paladin",
    bio: "25+ years leading digital operations at scale. Ran EA.com and 50+ franchise websites serving tens of millions of users in 20+ languages. Canadian Forces Company Sergeant Major with 30+ years of military leadership.",
  },
  {
    name: "Thomas Levi",
    role: "Chief Data Scientist",
    classTitle: "The Sorcerer",
    bio: "PhD in Theoretical Physics turned AI leader. Built data science teams from scratch at Unbounce and FullStory. Now VP of AI at Agiloft leading 20+ engineers. Multiple AI/ML patents pending and UBC Data Science advisory board member.",
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
              80+ Years Building Products.{" "}
              <span className="bg-linear-to-r from-primary via-indigo-400 to-accent bg-clip-text text-transparent">
                One We Always Needed.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              We&apos;ve scaled ea.com to tens of millions of users, shipped ML
              features that moved business metrics, published physics research,
              taught thousands of students, and led soldiers in wildfire
              response. Lorebound is the platform we kept wishing existed.
            </p>
          </div>
        </section>

        {/* Our Thesis */}
        <section className="border-y border-border/40 bg-muted/20 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Our Thesis
              </h2>
              <p className="mx-auto mt-6 max-w-3xl text-xl text-muted-foreground">
                AI tools treat every conversation as a blank slate. But real
                teams don&apos;t work that way — they build shared context,
                develop a voice, and get sharper over time. The missing layer
                in AI isn&apos;t intelligence.{" "}
                <span className="font-medium text-foreground">
                  It&apos;s identity.
                </span>
              </p>
              <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
                Lorebound makes identity persistent. Your AI agents
                remember who they are, what your team knows, and how you
                communicate — across every session, every workflow, every team
                member.
              </p>
            </div>
          </div>
        </section>

        {/* What We Saw */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                What We Saw
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">
                Patterns from decades of building products and leading teams
              </p>
            </div>

            <div className="mt-12 space-y-6">
              {observations.map((obs) => (
                <div
                  key={obs.insight}
                  className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-6"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <obs.icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{obs.insight}</h3>
                    <p className="mt-1 text-muted-foreground">{obs.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Believe */}
        <section className="border-y border-border/40 bg-muted/20 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                What We Believe
              </h2>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-3">
              {beliefs.map((belief) => (
                <div key={belief.title} className="text-center">
                  <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                    <belief.icon className="size-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{belief.title}</h3>
                  <p className="mt-3 text-muted-foreground">
                    {belief.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Built in Canada */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Built in Canada
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                All four founders are based in British Columbia. We build where
                we live and we take Canadian data sovereignty seriously.
              </p>
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
                Why Us, Why Now
              </h2>
              <p className="mx-auto mt-8 max-w-3xl text-xl text-muted-foreground">
                We&apos;ve led digital operations serving tens of millions of
                users across 50+ websites in 20+ languages. We&apos;ve built AI
                departments from scratch, shipped ML features that drove 20%
                lifts in customer lifetime value, published physics research,
                and held patents in machine learning. One of us has commanded
                soldiers in wildfire disaster response.
              </p>
              <p className="mx-auto mt-6 max-w-3xl text-xl font-medium text-foreground">
                That breadth is the point. Building AI agents that actually work
                requires more than ML chops — it takes operational rigor,
                product instinct, engineering craft honed over decades, and the
                discipline to ship reliably. Lorebound is the platform we
                wish existed when we were scaling our own companies.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                The Founding Party
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                A Canadian founding team with 25+ years at Electronic Arts
                between them, plus a PhD physicist turned AI leader, and a
                Company Sergeant Major who commands soldiers in disaster
                response. We&apos;ve built ea.com, designed the systems behind
                it, shipped ML products at scale, and taught the next generation
                of engineers. We know what hype looks like — and what actually
                ships.
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
              Build With Us
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We&apos;re looking for teams who are tired of AI that forgets who
              it&apos;s working for. Whether you&apos;re a startup founder, an
              incubator, or just curious — we&apos;d love to show you what
              persistent identity changes.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button asChild variant="gradient" size="lg" className="gap-2">
                <Link href="/contact">
                  Get in Touch
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

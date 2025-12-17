import Link from "next/link";
import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Lightbulb, Fingerprint } from "lucide-react";

export const metadata = {
  title: "About | Roleplai Teams",
  description:
    "Technology should amplify humanity, not replace it. Learn about our philosophy and approach to thoughtful AI.",
};

const pillars = [
  {
    icon: Users,
    title: "Human-First AI",
    description:
      "AI should work for you, not the other way around. Every feature we build starts with the question: does this keep humans in control?",
  },
  {
    icon: Lightbulb,
    title: "Thoughtful Development",
    description:
      "We don't ship features to check boxes. Every capability is designed with intention, tested for real workflows, and built to grow with your team.",
  },
  {
    icon: Fingerprint,
    title: "Authentic Extension",
    description:
      "Your identity is yours. Our job is to help you extend it - consistently, controllably, and authentically - across every AI interaction.",
  },
];

const team = [
  {
    name: "Ryan Eves",
    role: "Co-founder & CEO",
    classTitle: "The Bard",
    bio: "Product leader with nearly two decades in product and design. Lifelong gamer who believes the best products feel like play.",
  },
  {
    name: "Anthony Charles",
    role: "Co-founder & CTO",
    classTitle: "The Artificer",
    bio: "30+ years building intuitive products. TTRPG enthusiast since the 80s who brings that magic to enterprise software.",
  },
  {
    name: "Rob Bauman",
    role: "Co-founder & COO",
    classTitle: "The Paladin",
    bio: "22+ years in ops, former EA.com global lead. Active DM running three campaigns with 30+ years at the table.",
  },
  {
    name: "Thomas Levi",
    role: "Co-founder & Chief Data Scientist",
    classTitle: "The Sorcerer",
    bio: "ML visionary and former physicist. Brings strategic thinking from both data science and tabletop gameplay.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,80,200,0.15),rgba(255,255,255,0))]" />

          <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Technology Should{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
                Amplify Humanity,
              </span>{" "}
              Not Replace It.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              We&apos;re building AI tools that extend your team&apos;s
              authentic voice into every interaction.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="border-y border-border/40 bg-muted/20 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Our Mission
              </h2>
              <blockquote className="mt-8 text-xl italic text-muted-foreground sm:text-2xl">
                &ldquo;We believe the best AI doesn&apos;t sound like AI - it
                sounds like you. RoleplayAI Teams exists to help teams create AI
                agents that carry their unique voice, expertise, and values into
                every conversation.&rdquo;
              </blockquote>
            </div>
          </div>
        </section>

        {/* Three Pillars */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Our Approach
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Three principles that guide everything we build
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

        {/* The Problem */}
        <section className="border-y border-border/40 bg-muted/20 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                The Problem We Solve
              </h2>
              <div className="mt-8 rounded-xl border border-border/50 bg-card p-8 text-left">
                <p className="text-lg text-muted-foreground">
                  Today&apos;s AI tools are generic by design. They don&apos;t
                  know your brand voice, your team&apos;s expertise, or your
                  values. Every conversation starts from scratch.
                </p>
                <p className="mt-4 text-lg font-medium text-foreground">
                  The result? AI that sounds like everyone else&apos;s AI.
                </p>
                <p className="mt-4 text-lg text-muted-foreground">
                  Your team has spent years developing a unique voice, building
                  domain expertise, and establishing trust with customers. Why
                  should your AI throw all that away?
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Vision */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Our Vision
              </h2>
              <p className="mx-auto mt-8 max-w-3xl text-xl text-muted-foreground">
                We envision a future where every team has AI agents that truly
                represent them. Where technology amplifies human creativity and
                expertise rather than homogenizing it.
              </p>
              <p className="mx-auto mt-6 max-w-3xl text-xl font-medium text-foreground">
                Where your AI sounds unmistakably like you.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="border-y border-border/40 bg-muted/20 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                The Party
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                A band of seasoned adventurers with 80+ combined years in product, engineering, and AI -
                united by a love of games and a belief that work software should feel like play.
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
              Join the Adventure
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Ready to level up your team&apos;s AI? Your quest starts here.
            </p>
            <div className="mt-8">
              <Button asChild variant="gradient" size="lg" className="gap-2">
                <Link href="/signup">
                  Begin Your Journey
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

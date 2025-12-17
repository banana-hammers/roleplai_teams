import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,80,200,0.15),rgba(255,255,255,0))]" />

      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:py-40">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Level Up Your AI Game
          </div>

          {/* Headline */}
          <h1 className="max-w-4xl font-display text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
              Level Up
            </span>{" "}
            Your Team&apos;s AI
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Create AI agents that grow with your team. Define your identity,
            unlock powerful roles, and watch your AI evolve from generic to
            genuinely yours.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button asChild variant="gradient" size="lg" className="gap-2">
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="#how-it-works">
                <Play className="size-4" />
                See How It Works
              </Link>
            </Button>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 w-full max-w-4xl">
            <div className="relative rounded-xl border border-border/50 bg-gradient-to-b from-card to-card/50 p-2 shadow-2xl shadow-primary/10">
              <div className="overflow-hidden rounded-lg border border-border/30 bg-background">
                {/* Mock App Interface */}
                <div className="flex items-center gap-2 border-b border-border/30 bg-muted/30 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="size-3 rounded-full bg-red-400" />
                    <div className="size-3 rounded-full bg-yellow-400" />
                    <div className="size-3 rounded-full bg-green-400" />
                  </div>
                  <div className="mx-auto text-xs text-muted-foreground">
                    roleplai-teams.app
                  </div>
                </div>
                <div className="grid gap-4 p-6 sm:grid-cols-3">
                  <div className="rounded-lg bg-identity-accent/10 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-2xl">🎭</span>
                      <span className="rounded-full bg-identity-accent/20 px-2 py-0.5 text-xs font-medium text-identity-accent">
                        LVL 3
                      </span>
                    </div>
                    <div className="font-medium">Identity Core</div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-identity-accent/20">
                      <div className="h-full w-3/4 rounded-full bg-identity-accent" />
                    </div>
                  </div>
                  <div className="rounded-lg bg-roles-accent/10 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-2xl">⚡</span>
                      <span className="rounded-full bg-roles-accent/20 px-2 py-0.5 text-xs font-medium text-roles-accent">
                        LVL 2
                      </span>
                    </div>
                    <div className="font-medium">Sales Role</div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-roles-accent/20">
                      <div className="h-full w-1/2 rounded-full bg-roles-accent" />
                    </div>
                  </div>
                  <div className="rounded-lg bg-skills-accent/10 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-2xl">🔧</span>
                      <span className="rounded-full bg-skills-accent/20 px-2 py-0.5 text-xs font-medium text-skills-accent">
                        +50 XP
                      </span>
                    </div>
                    <div className="font-medium">Draft Email</div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-skills-accent/20">
                      <div className="h-full w-full rounded-full bg-skills-accent" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

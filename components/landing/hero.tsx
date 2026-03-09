import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Fingerprint,
  Code2,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />

      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col items-center text-center">
          {/* Headline */}
          <h1 className="max-w-4xl font-display text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Your Knowledge,{" "}
            <span className="bg-linear-to-r from-primary via-indigo-400 to-accent bg-clip-text text-transparent">
              Amplified
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Lorebound agents carry your identity, knowledge, and skills into every interaction. The more you invest, the more powerful they become.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild variant="gradient" size="lg" className="gap-2">
              <Link href="/about#contact">
                Book a Demo
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/signup">
                Try It Free
              </Link>
            </Button>
          </div>

          {/* Credibility line */}
          <p className="mt-6 text-sm text-muted-foreground">
            Built by a team with 80+ years shipping products that work
          </p>

          {/* Identity Core Card */}
          <div className="mt-10 w-full max-w-md rounded-xl border border-identity-accent/30 bg-card/80 shadow-lg backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/40 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-identity-accent/20">
                <Fingerprint className="size-5 text-identity-accent" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold">Your Identity Core</h3>
                <p className="text-xs text-muted-foreground">
                  Not another chatbot with a blank prompt
                </p>
              </div>
              <Code2 className="size-5 text-muted-foreground" />
            </div>

            {/* Identity attributes - tech-focused example */}
            <div className="space-y-3 p-4">
              <div className="flex items-start gap-3 text-left">
                <span className="mt-0.5 text-xs font-medium uppercase tracking-wider text-identity-accent">
                  Voice
                </span>
                <span className="flex-1 text-sm text-foreground">
                  Direct but collaborative
                </span>
              </div>
              <div className="flex items-start gap-3 text-left">
                <span className="mt-0.5 text-xs font-medium uppercase tracking-wider text-skills-accent">
                  Priority
                </span>
                <span className="flex-1 text-sm text-foreground">
                  Ship quality work, fast
                </span>
              </div>
              <div className="flex items-start gap-3 text-left">
                <span className="mt-0.5 text-xs font-medium uppercase tracking-wider text-missions-accent">
                  Boundary
                </span>
                <span className="flex-1 text-sm text-foreground">
                  Never cut corners on security
                </span>
              </div>
            </div>

            {/* Value prop */}
            <div className="border-t border-border/40 bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground text-left">
                Captured in a 5-minute conversation with Nova, your identity guide.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

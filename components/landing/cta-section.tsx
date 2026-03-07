import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      {/* Background gradient - stronger */}
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/15 via-background to-accent/15" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_60%)]" />

      {/* Decorative elements */}
      <div className="absolute left-1/4 top-1/4 -z-10 size-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 size-64 rounded-full bg-accent/10 blur-3xl" />

      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center text-center">
          {/* Social proof */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            <span>Built by a team with 80+ years shipping products</span>
          </div>

          <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Ready to{" "}
            <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
              Elevate Your Team?
            </span>
          </h2>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Meet Nova, your AI guide. In 5 minutes, capture your voice and start building AI that actually sounds like you.
          </p>

          <div className="mt-10">
            <Button asChild variant="gradient" size="lg" className="gap-2">
              <Link href="/signup">
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Free to start. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(120,80,200,0.1),transparent_70%)]" />

      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Ready to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              start your quest?
            </span>
          </h2>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Join teams leveling up their AI game. Create your first character
            in minutes and watch your agents evolve.
          </p>

          <div className="mt-10">
            <Button asChild variant="gradient" size="lg" className="gap-2">
              <Link href="/signup">
                Begin Your Journey
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Starter pack: 1 identity core, 3 roles, 10 skills. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}

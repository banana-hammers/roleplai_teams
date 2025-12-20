"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useIndustry,
  industries,
  industryKeys,
} from "@/components/landing/industry-context";

export function Hero() {
  const { activeIndustry, setActiveIndustry } = useIndustry();

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,80,200,0.15),rgba(255,255,255,0))]" />

      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            AI That Grows With You
          </div>

          {/* Headline */}
          <h1 className="max-w-4xl font-display text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
              Level Up Together
            </span>{" "}
            With Your RoleplAIrs
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            AI agents with your personality that level up the more you use them.
            Created through conversation, not configuration.
          </p>

          {/* CTA */}
          <div className="mt-10">
            <Button asChild variant="gradient" size="lg" className="gap-2">
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          {/* Industry Pills */}
          <div className="mt-10">
            <p className="mb-4 text-sm text-muted-foreground">
              See how it works for your industry
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {industryKeys.map((key) => {
                const industry = industries[key];
                const Icon = industry.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveIndustry(key)}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                      activeIndustry === key
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                    {industry.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

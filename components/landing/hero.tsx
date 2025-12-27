"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Fingerprint,
  MessageSquareQuote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useIndustry,
  industries,
  industryKeys,
} from "@/components/landing/industry-context";

export function Hero() {
  const { activeIndustry, setActiveIndustry, current, isTransitioning } =
    useIndustry();
  const Icon = current.icon;

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />

      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col items-center text-center">
          {/* Headline */}
          <h1 className="max-w-4xl font-display text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Start With{" "}
            <span className="bg-linear-to-r from-primary via-indigo-400 to-accent bg-clip-text text-transparent">
              Who You Are
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Every great AI partner begins with understanding you.
            <br />
            Capture your voice, priorities, and boundaries in minutes.
          </p>

          {/* CTA */}
          <div className="mt-10">
            <Button asChild variant="gradient" size="lg" className="gap-2">
              <Link href="/signup">
                Begin Your Journey
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          {/* Industry Pills */}
          <div className="mt-12">
            <p className="mb-4 text-sm text-muted-foreground">
              See how it works for your industry
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {industryKeys.map((key) => {
                const industry = industries[key];
                const IndustryIcon = industry.icon;
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
                    <IndustryIcon className="size-4" />
                    {industry.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Identity Core Card */}
          <div
            className={cn(
              "mt-10 w-full max-w-md rounded-xl border border-identity-accent/30 bg-card/80 shadow-lg backdrop-blur-sm transition-all duration-200",
              isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/40 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-identity-accent/20">
                <Fingerprint className="size-5 text-identity-accent" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold">Your Identity Core</h3>
                <p className="text-xs text-muted-foreground">
                  {current.phaseOne.headline}
                </p>
              </div>
              <Icon className="size-5 text-muted-foreground" />
            </div>

            {/* Identity attributes */}
            <div className="space-y-3 p-4">
              <div className="flex items-start gap-3 text-left">
                <span className="mt-0.5 text-xs font-medium uppercase tracking-wider text-identity-accent">
                  Voice
                </span>
                <span className="flex-1 text-sm text-foreground">
                  {current.phaseOne.identityExample.voice}
                </span>
              </div>
              <div className="flex items-start gap-3 text-left">
                <span className="mt-0.5 text-xs font-medium uppercase tracking-wider text-skills-accent">
                  Priority
                </span>
                <span className="flex-1 text-sm text-foreground">
                  {current.phaseOne.identityExample.priority}
                </span>
              </div>
              <div className="flex items-start gap-3 text-left">
                <span className="mt-0.5 text-xs font-medium uppercase tracking-wider text-missions-accent">
                  Boundary
                </span>
                <span className="flex-1 text-sm text-foreground">
                  {current.phaseOne.identityExample.boundary}
                </span>
              </div>
            </div>

            {/* Testimonial */}
            <div className="border-t border-border/40 bg-muted/30 p-4">
              <div className="flex items-start gap-2 text-left">
                <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-sm italic text-muted-foreground">
                  &ldquo;{current.phaseOne.testimonialSnippet}&rdquo;
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

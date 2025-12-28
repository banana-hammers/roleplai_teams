"use client";

import {
  Target,
  Users2,
  AtSign,
  CalendarClock,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIndustry } from "@/components/landing/industry-context";

const featureStyles = {
  "roles-accent": {
    border: "border-roles-accent/30 hover:border-roles-accent/50",
    borderLeft: "border-l-roles-accent",
    bg: "bg-roles-accent/10",
    text: "text-roles-accent",
  },
  "context-accent": {
    border: "border-context-accent/30 hover:border-context-accent/50",
    borderLeft: "border-l-context-accent",
    bg: "bg-context-accent/10",
    text: "text-context-accent",
  },
  "skills-accent": {
    border: "border-skills-accent/30 hover:border-skills-accent/50",
    borderLeft: "border-l-skills-accent",
    bg: "bg-skills-accent/10",
    text: "text-skills-accent",
  },
  "missions-accent": {
    border: "border-missions-accent/30 hover:border-missions-accent/50",
    borderLeft: "border-l-missions-accent",
    bg: "bg-missions-accent/10",
    text: "text-missions-accent",
  },
} as const;

type FeatureColorKey = keyof typeof featureStyles;

const features: {
  icon: typeof Users2;
  title: string;
  description: string;
  color: FeatureColorKey;
}[] = [
  {
    icon: Users2,
    title: "Cross-Functional Teams",
    description: "Bring together RoleplAIrs across roles and disciplines",
    color: "roles-accent",
  },
  {
    icon: AtSign,
    title: "Seamless Handoffs",
    description: "Context flows between team members without repetition",
    color: "context-accent",
  },
  {
    icon: TrendingUp,
    title: "Shared Progress",
    description: "Everyone sees the same picture, always in sync",
    color: "skills-accent",
  },
  {
    icon: CalendarClock,
    title: "Async Collaboration",
    description: "Work moves forward even when you're not online",
    color: "missions-accent",
  },
];

export function PhaseMissions() {
  const { current, isTransitioning } = useIndustry();
  const mission = current.mission;

  return (
    <section id="missions" className="relative py-12 sm:py-16">
      {/* Subtle overlay to indicate Coming Soon */}
      <div className="pointer-events-none absolute inset-0 bg-background/40" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-missions-accent/30 bg-missions-accent/10 px-3 py-1 text-xs font-medium text-missions-accent">
            <Target className="size-3" />
            Coming Soon
          </div>

          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="bg-linear-to-r from-missions-accent to-context-accent bg-clip-text text-transparent">
              Scale
            </span>{" "}
            Across Your Organization
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            When everyone has a RoleplAIr, the whole team moves faster
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* Left: Party Visualization */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-full max-w-sm">
              {/* Mission Goal Card */}
              <div
                className={cn(
                  "rounded-xl border border-missions-accent/30 bg-card p-6 shadow-lg transition-all duration-200",
                  isTransitioning
                    ? "opacity-0 translate-y-2"
                    : "opacity-100 translate-y-0"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-missions-accent/20 p-2">
                    <Target className="size-6 text-missions-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{mission.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {mission.description}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-missions-accent">
                      {mission.progress}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-missions-accent/20">
                    <div
                      className="h-full rounded-full bg-missions-accent transition-all duration-300"
                      style={{ width: `${mission.progress}%` }}
                    />
                  </div>
                </div>

                {/* Team Avatars with owner badges */}
                <div className="mt-6">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Mission Team
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mission.team.map((member) => (
                      <div
                        key={member.name}
                        className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5"
                      >
                        <div className={`size-2.5 rounded-full ${member.color}`} />
                        <span className="text-sm">{member.name}</span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                            member.owner === "you"
                              ? "bg-identity-accent/20 text-identity-accent"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {member.owner === "you" ? "yours" : "team"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Handoff Example */}
                <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 p-3">
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-missions-accent" />
                    <div>
                      <span className="font-medium">{mission.handoff.from}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        handing off to{" "}
                      </span>
                      <span className="font-medium">{mission.handoff.to}</span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        &ldquo;{mission.handoff.message}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

                {/* Collaboration Highlight */}
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Sparkles className="size-4 text-missions-accent" />
                  <span className="italic text-muted-foreground">
                    {current.phaseThree.collaborationHighlight}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Feature List */}
          <div className="flex flex-col justify-center">
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature) => {
                const styles = featureStyles[feature.color];
                return (
                  <div
                    key={feature.title}
                    className={cn(
                      "rounded-xl border border-l-4 bg-card p-4 transition-colors",
                      styles.border,
                      styles.borderLeft
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("rounded-lg p-2", styles.bg)}>
                        <feature.icon className={cn("size-5", styles.text)} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{feature.title}</h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

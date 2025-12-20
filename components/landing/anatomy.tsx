"use client";

import {
  Fingerprint,
  Users,
  BookOpen,
  Zap,
  Wrench,
  Check,
  TrendingUp,
  Brain,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIndustry } from "@/components/landing/industry-context";

// Tailwind requires full class names at build time - can't use dynamic interpolation
const colorStyles = {
  "identity-accent": {
    border: "border-identity-accent/30 hover:border-identity-accent/50",
    borderLeft: "border-l-identity-accent",
    bg: "bg-identity-accent/10",
    text: "text-identity-accent",
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
  muted: {
    border: "border-border/50",
    borderLeft: "",
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
} as const;

type ColorKey = keyof typeof colorStyles;

const components: {
  icon: typeof Fingerprint;
  name: string;
  description: string;
  color: ColorKey;
  muted?: boolean;
}[] = [
  {
    icon: Fingerprint,
    name: "Identity Core",
    description:
      "Your voice, values, and boundaries. Created once through a conversation with Nova, then inherited by every RoleplAIr you create.",
    color: "identity-accent",
  },
  {
    icon: BookOpen,
    name: "Lore",
    description:
      "Context they remember — your bio, brand guidelines, product docs. Attach different Lore packs to different RoleplAIrs.",
    color: "context-accent",
  },
  {
    icon: Zap,
    name: "Skills",
    description:
      "Abilities they can perform — draft emails, review code, summarize docs. Skills earn XP and level up the more you use them.",
    color: "skills-accent",
  },
  {
    icon: Wrench,
    name: "Tools",
    description:
      "Integrations that let them take action — send emails, create PRs, update calendars. Coming soon.",
    color: "muted",
    muted: true,
  },
];

export function Anatomy() {
  const { current, isTransitioning } = useIndustry();
  const Icon = current.icon;

  return (
    <section id="roleplaIrs" className="bg-muted/20 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Meet Your{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              RoleplAIrs
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            AI agents with your personality that level up the more you use them
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* Left: Example RoleplAIr Card */}
          <div className="flex items-center justify-center">
            <div
              className={cn(
                "w-full max-w-sm rounded-xl border border-roles-accent/30 bg-card p-6 shadow-lg transition-all duration-200",
                isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
              )}
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-roles-accent/20">
                  <Icon className="size-6 text-roles-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{current.roleplAIr.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {current.roleplAIr.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-skills-accent/10 px-2 py-1 text-xs font-medium text-skills-accent">
                  <TrendingUp className="size-3" />
                  LVL 4
                </div>
              </div>

              {/* Identity Core Status */}
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-identity-accent/20 bg-identity-accent/5 px-3 py-2">
                <Fingerprint className="size-4 text-identity-accent" />
                <span className="text-sm">Identity Core</span>
                <Check className="ml-auto size-4 text-identity-accent" />
              </div>

              {/* Lore */}
              <div className="mt-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <BookOpen className="size-3" />
                  Lore
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {current.lore.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-context-accent/20 bg-context-accent/10 px-2.5 py-1 text-xs"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Skills with XP */}
              <div className="mt-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Zap className="size-3" />
                  Skills
                </div>
                <div className="space-y-2">
                  {current.skills.map((skill) => (
                    <div key={skill.name}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span>{skill.name}</span>
                        <span className="text-skills-accent">LVL {skill.level}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-skills-accent/20">
                        <div
                          className="h-full rounded-full bg-skills-accent transition-all duration-300"
                          style={{ width: `${skill.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth indicators */}
              <div className="mt-5 space-y-2 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Brain className="size-3 text-roles-accent" />
                  <span>Learns your preferences over time</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <History className="size-3 text-roles-accent" />
                  <span>Remembers past conversations</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Component Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {components.map((component) => {
              const styles = colorStyles[component.color];
              return (
                <div
                  key={component.name}
                  className={cn(
                    "rounded-xl border bg-card p-5 transition-colors",
                    styles.border,
                    !component.muted && "border-l-4",
                    !component.muted && styles.borderLeft
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("shrink-0 rounded-lg p-2", styles.bg)}>
                      <component.icon
                        className={cn(
                          component.muted ? "size-5" : "size-6",
                          styles.text
                        )}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold">{component.name}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {component.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { useActivePhase, type Phase } from "@/hooks/use-active-phase";
import { Fingerprint, Zap, Users2 } from "lucide-react";

const phases: {
  id: Phase;
  label: string;
  shortLabel: string;
  icon: typeof Fingerprint;
  color: string;
  activeColor: string;
  bgColor: string;
}[] = [
  {
    id: "define",
    label: "Define",
    shortLabel: "1",
    icon: Fingerprint,
    color: "text-identity-accent",
    activeColor: "border-identity-accent bg-identity-accent",
    bgColor: "bg-identity-accent/20",
  },
  {
    id: "build",
    label: "Build",
    shortLabel: "2",
    icon: Zap,
    color: "text-roles-accent",
    activeColor: "border-roles-accent bg-roles-accent",
    bgColor: "bg-roles-accent/20",
  },
  {
    id: "scale",
    label: "Scale",
    shortLabel: "3",
    icon: Users2,
    color: "text-missions-accent",
    activeColor: "border-missions-accent bg-missions-accent",
    bgColor: "bg-missions-accent/20",
  },
];

export function JourneyTimeline() {
  const activePhase = useActivePhase();

  const scrollToPhase = (phaseId: Phase) => {
    const element = document.getElementById(`phase-${phaseId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="fixed left-1/2 top-20 z-40 -translate-x-1/2 hidden md:block">
      <div className="flex items-center gap-1 rounded-full border border-border/50 bg-background/80 px-2 py-1.5 shadow-lg backdrop-blur-md">
        {phases.map((phase, index) => {
          const isActive = activePhase === phase.id;
          const isPast =
            phases.findIndex((p) => p.id === activePhase) >
            phases.findIndex((p) => p.id === phase.id);
          const Icon = phase.icon;

          return (
            <div key={phase.id} className="flex items-center">
              {/* Phase node */}
              <button
                onClick={() => scrollToPhase(phase.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-300",
                  isActive
                    ? `${phase.activeColor} text-white shadow-sm`
                    : isPast
                      ? `${phase.bgColor} ${phase.color}`
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="size-3" />
                <span className="hidden sm:inline">{phase.label}</span>
                <span className="sm:hidden">{phase.shortLabel}</span>
              </button>

              {/* Connector line */}
              {index < phases.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-px w-4 transition-colors duration-300",
                    isPast ? "bg-muted-foreground/30" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

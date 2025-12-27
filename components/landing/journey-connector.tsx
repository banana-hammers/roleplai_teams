"use client";

import { cn } from "@/lib/utils";

type Phase = "identity" | "roleplaairs" | "missions";

const phaseColors: Record<Phase, string> = {
  identity: "from-identity-accent",
  roleplaairs: "from-roles-accent to-roles-accent",
  missions: "to-missions-accent",
};

const phaseDotColors: Record<Phase, string> = {
  identity: "bg-identity-accent",
  roleplaairs: "bg-roles-accent",
  missions: "bg-missions-accent",
};

interface JourneyConnectorProps {
  from: "identity" | "roleplaairs";
  to: "roleplaairs" | "missions";
  message: string;
}

export function JourneyConnector({ from, to, message }: JourneyConnectorProps) {
  const gradientClass = cn(
    "bg-linear-to-r",
    phaseColors[from],
    phaseColors[to]
  );

  return (
    <div className="relative py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-center">
          {/* Left line */}
          <div className={cn("h-px flex-1 opacity-30", gradientClass)} />

          {/* From milestone dot */}
          <div className={cn("size-2 rounded-full opacity-50", phaseDotColors[from])} />

          {/* Message */}
          <div className="mx-4 rounded-full border border-border/40 bg-background/80 px-4 py-2 text-sm backdrop-blur-sm">
            <span className="text-muted-foreground">{message}</span>
          </div>

          {/* To milestone dot */}
          <div className={cn("size-2 rounded-full opacity-50", phaseDotColors[to])} />

          {/* Right line */}
          <div className={cn("h-px flex-1 opacity-30", gradientClass)} />
        </div>
      </div>
    </div>
  );
}

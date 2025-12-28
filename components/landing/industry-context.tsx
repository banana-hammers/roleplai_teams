"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Code2, type LucideIcon } from "lucide-react";

export type PhaseTwoData = {
  benefits: string[];
};

export type PhaseThreeData = {
  collaborationHighlight: string;
};

export type IndustryData = {
  label: string;
  icon: LucideIcon;
  roleplAIr: {
    name: string;
    description: string;
  };
  lore: string[];
  skills: {
    name: string;
    progress: number; // 0-100
  }[];
  mission: {
    name: string;
    description: string;
    progress: number;
    team: { name: string; color: string; owner: "you" | "teammate" }[];
    handoff: {
      from: string;
      to: string;
      message: string;
    };
  };
  phaseTwo: PhaseTwoData;
  phaseThree: PhaseThreeData;
};

// Single tech-focused example for all landing page content
const techData: IndustryData = {
  label: "Tech",
  icon: Code2,
  roleplAIr: {
    name: "Tech Lead Assistant",
    description: "Your voice, amplified",
  },
  lore: ["Architecture Docs", "Code Standards", "Team Playbook"],
  skills: [
    { name: "Code Review", progress: 85 },
    { name: "Documentation", progress: 70 },
  ],
  mission: {
    name: "Launch New Feature",
    description: "Cross-functional collaboration",
    progress: 65,
    team: [
      { name: "Tech Lead", color: "bg-roles-accent", owner: "you" },
      { name: "Product", color: "bg-skills-accent", owner: "teammate" },
      { name: "Design", color: "bg-identity-accent", owner: "teammate" },
    ],
    handoff: {
      from: "Tech Lead",
      to: "Product",
      message: "Implementation ready for review",
    },
  },
  phaseTwo: {
    benefits: [
      "Learns your team's coding standards",
      "Remembers architectural decisions",
      "Adapts to your review style",
    ],
  },
  phaseThree: {
    collaborationHighlight: "Your engineering + teammate's product = aligned execution",
  },
};

type IndustryContextType = {
  current: IndustryData;
  isTransitioning: boolean;
};

const IndustryContext = createContext<IndustryContextType | null>(null);

export function IndustryProvider({ children }: { children: ReactNode }) {
  return (
    <IndustryContext.Provider
      value={{
        current: techData,
        isTransitioning: false,
      }}
    >
      {children}
    </IndustryContext.Provider>
  );
}

export function useIndustry() {
  const context = useContext(IndustryContext);
  if (!context) {
    throw new Error("useIndustry must be used within IndustryProvider");
  }
  return context;
}

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

// SaaS startup-focused example for all landing page content
const techData: IndustryData = {
  label: "SaaS Startup",
  icon: Code2,
  roleplAIr: {
    name: "Founder's Right Hand",
    description: "Wears every hat, knows every context",
  },
  lore: ["ICP & Personas", "Brand Voice Guide", "Competitive Landscape"],
  skills: [
    { name: "Outbound Messaging", progress: 85 },
    { name: "Customer Onboarding", progress: 70 },
  ],
  mission: {
    name: "Close First 10 Customers",
    description: "Coordinated sales & onboarding",
    progress: 65,
    team: [
      { name: "Sales Agent", color: "bg-roles-accent", owner: "you" },
      { name: "Onboarding", color: "bg-skills-accent", owner: "you" },
      { name: "Support", color: "bg-identity-accent", owner: "teammate" },
    ],
    handoff: {
      from: "Sales Agent",
      to: "Onboarding",
      message: "Deal closed — kicking off implementation",
    },
  },
  phaseTwo: {
    benefits: [
      "Learns your startup's ICP and messaging",
      "Remembers every customer conversation",
      "Adapts to your founder's voice",
    ],
  },
  phaseThree: {
    collaborationHighlight: "Your sales agent + onboarding agent = zero-gap handoffs",
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

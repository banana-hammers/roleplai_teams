"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { TrendingUp, Headphones, Megaphone, type LucideIcon } from "lucide-react";

export type IndustryKey = "sales" | "support" | "marketing";

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
    level: number;
    progress: number; // 0-100
  }[];
  mission: {
    name: string;
    description: string;
    progress: number;
    team: { name: string; color: string }[];
    handoff: {
      from: string;
      to: string;
      message: string;
    };
  };
};

export const industries: Record<IndustryKey, IndustryData> = {
  sales: {
    label: "Sales",
    icon: TrendingUp,
    roleplAIr: {
      name: "Lead Qualifier",
      description: "Ready to help",
    },
    lore: ["Sales Playbook", "Product Docs", "Pricing Guide"],
    skills: [
      { name: "Discovery Calls", level: 4, progress: 80 },
      { name: "Objection Handling", level: 3, progress: 60 },
    ],
    mission: {
      name: "Close Q4 Pipeline",
      description: "3 RoleplAIrs working together",
      progress: 65,
      team: [
        { name: "Qualifier", color: "bg-roles-accent" },
        { name: "Researcher", color: "bg-skills-accent" },
        { name: "Closer", color: "bg-identity-accent" },
      ],
      handoff: {
        from: "Qualifier",
        to: "Closer",
        message: "Lead qualified. Ready for demo!",
      },
    },
  },
  support: {
    label: "Customer Support",
    icon: Headphones,
    roleplAIr: {
      name: "Support Agent",
      description: "Ready to help",
    },
    lore: ["Support Docs", "FAQ Database", "Escalation Guide"],
    skills: [
      { name: "Troubleshooting", level: 5, progress: 95 },
      { name: "Ticket Triage", level: 3, progress: 55 },
    ],
    mission: {
      name: "Clear Ticket Backlog",
      description: "4 RoleplAIrs working together",
      progress: 45,
      team: [
        { name: "Triage", color: "bg-roles-accent" },
        { name: "Resolver", color: "bg-skills-accent" },
        { name: "Escalator", color: "bg-identity-accent" },
        { name: "Follow-up", color: "bg-context-accent" },
      ],
      handoff: {
        from: "Triage",
        to: "Resolver",
        message: "Priority ticket incoming!",
      },
    },
  },
  marketing: {
    label: "Marketing",
    icon: Megaphone,
    roleplAIr: {
      name: "Content Strategist",
      description: "Ready to help",
    },
    lore: ["Brand Voice", "Content Calendar", "SEO Keywords"],
    skills: [
      { name: "Blog Writing", level: 4, progress: 85 },
      { name: "Social Copy", level: 3, progress: 50 },
    ],
    mission: {
      name: "Launch Product Campaign",
      description: "4 RoleplAIrs working together",
      progress: 45,
      team: [
        { name: "Research", color: "bg-roles-accent" },
        { name: "Writer", color: "bg-skills-accent" },
        { name: "Strategist", color: "bg-identity-accent" },
        { name: "Editor", color: "bg-context-accent" },
      ],
      handoff: {
        from: "Writer",
        to: "Editor",
        message: "Draft complete. Ready for your review!",
      },
    },
  },
};

type IndustryContextType = {
  activeIndustry: IndustryKey;
  setActiveIndustry: (industry: IndustryKey) => void;
  current: IndustryData;
  isTransitioning: boolean;
};

const IndustryContext = createContext<IndustryContextType | null>(null);

export function IndustryProvider({ children }: { children: ReactNode }) {
  const [activeIndustry, setActiveIndustryState] = useState<IndustryKey>("sales");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const setActiveIndustry = (industry: IndustryKey) => {
    if (industry === activeIndustry) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndustryState(industry);
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <IndustryContext.Provider
      value={{
        activeIndustry,
        setActiveIndustry,
        current: industries[activeIndustry],
        isTransitioning,
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

export const industryKeys = Object.keys(industries) as IndustryKey[];

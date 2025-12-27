"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { TrendingUp, Headphones, Megaphone, type LucideIcon } from "lucide-react";

export type IndustryKey = "sales" | "support" | "marketing";

export type PhaseOneData = {
  headline: string;
  identityExample: {
    voice: string;
    priority: string;
    boundary: string;
  };
  testimonialSnippet: string;
};

export type PhaseTwoData = {
  levelUpBenefits: string[];
};

export type PhaseThreeData = {
  collaborationHighlight: string;
};

export type GrowthData = {
  phase1Transformation: {
    before: string;
    after: string;
  };
  phase2Transformation: {
    before: string;
    after: string;
  };
  unlockRequirements: {
    phase2: string;
    phase3: string;
  };
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
    level: number;
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
  phaseOne: PhaseOneData;
  phaseTwo: PhaseTwoData;
  phaseThree: PhaseThreeData;
  growth: GrowthData;
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
        { name: "Qualifier", color: "bg-roles-accent", owner: "you" },
        { name: "Researcher", color: "bg-skills-accent", owner: "teammate" },
        { name: "Closer", color: "bg-identity-accent", owner: "you" },
      ],
      handoff: {
        from: "Qualifier",
        to: "Closer",
        message: "Lead qualified. Ready for demo!",
      },
    },
    phaseOne: {
      headline: "AI that speaks like a closer",
      identityExample: {
        voice: "Warm but direct",
        priority: "Close deals efficiently",
        boundary: "Never discount below 20%",
      },
      testimonialSnippet: "It's like having a clone who knows my playbook",
    },
    phaseTwo: {
      levelUpBenefits: [
        "Learns your objection patterns",
        "Remembers past deal contexts",
        "Suggests optimal follow-up timing",
      ],
    },
    phaseThree: {
      collaborationHighlight: "Your closer + teammate's researcher = unstoppable",
    },
    growth: {
      phase1Transformation: {
        before: "Generic AI that sounds robotic",
        after: "AI that speaks like a seasoned closer",
      },
      phase2Transformation: {
        before: "One-size-fits-all sales assistant",
        after: "Lead Qualifier that knows your playbook",
      },
      unlockRequirements: {
        phase2: "Complete your Identity Core interview",
        phase3: "Reach LVL 3 with your first RoleplAIr",
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
        { name: "Triage", color: "bg-roles-accent", owner: "you" },
        { name: "Resolver", color: "bg-skills-accent", owner: "you" },
        { name: "Escalator", color: "bg-identity-accent", owner: "teammate" },
        { name: "Follow-up", color: "bg-context-accent", owner: "teammate" },
      ],
      handoff: {
        from: "Triage",
        to: "Resolver",
        message: "Priority ticket incoming!",
      },
    },
    phaseOne: {
      headline: "AI that cares like you do",
      identityExample: {
        voice: "Patient and thorough",
        priority: "Resolve on first contact",
        boundary: "Escalate when customer is frustrated",
      },
      testimonialSnippet: "Finally, support that sounds like our team",
    },
    phaseTwo: {
      levelUpBenefits: [
        "Learns common issue patterns",
        "Remembers customer history",
        "Predicts escalation needs",
      ],
    },
    phaseThree: {
      collaborationHighlight: "Your triage + teammate's escalator = zero dropped tickets",
    },
    growth: {
      phase1Transformation: {
        before: "Generic AI with no empathy",
        after: "AI that cares like your best agent",
      },
      phase2Transformation: {
        before: "Basic chatbot responses",
        after: "Support Agent that knows your docs",
      },
      unlockRequirements: {
        phase2: "Complete your Identity Core interview",
        phase3: "Reach LVL 3 with your first RoleplAIr",
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
        { name: "Research", color: "bg-roles-accent", owner: "you" },
        { name: "Writer", color: "bg-skills-accent", owner: "you" },
        { name: "Strategist", color: "bg-identity-accent", owner: "teammate" },
        { name: "Editor", color: "bg-context-accent", owner: "teammate" },
      ],
      handoff: {
        from: "Writer",
        to: "Editor",
        message: "Draft complete. Ready for your review!",
      },
    },
    phaseOne: {
      headline: "AI that writes in your voice",
      identityExample: {
        voice: "Bold and creative",
        priority: "Brand consistency first",
        boundary: "No clickbait, ever",
      },
      testimonialSnippet: "Content that actually sounds like our brand",
    },
    phaseTwo: {
      levelUpBenefits: [
        "Learns your brand voice nuances",
        "Remembers campaign contexts",
        "Suggests content angles",
      ],
    },
    phaseThree: {
      collaborationHighlight: "Your writer + teammate's strategist = campaigns that convert",
    },
    growth: {
      phase1Transformation: {
        before: "Generic AI copy that misses your tone",
        after: "AI that writes in your brand voice",
      },
      phase2Transformation: {
        before: "One-size-fits-all content generator",
        after: "Content Strategist that knows your audience",
      },
      unlockRequirements: {
        phase2: "Complete your Identity Core interview",
        phase3: "Reach LVL 3 with your first RoleplAIr",
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

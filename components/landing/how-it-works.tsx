import { User, Layers, Zap } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: User,
    title: "Create Your Character",
    description:
      "Define your team's identity - voice, priorities, and boundaries. This is your base class that all agents inherit from.",
    color: "text-identity-accent",
    bgColor: "bg-identity-accent/10",
  },
  {
    number: "02",
    icon: Layers,
    title: "Unlock Roles",
    description:
      "Spawn specialized agents for different quests. Each role levels up independently while carrying your core identity.",
    color: "text-roles-accent",
    bgColor: "bg-roles-accent/10",
  },
  {
    number: "03",
    icon: Zap,
    title: "Equip Skills",
    description:
      "Power up your roles with actionable abilities. Draft emails, analyze docs, search the web - each skill earns XP as it's used.",
    color: "text-skills-accent",
    bgColor: "bg-skills-accent/10",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Your Journey Begins
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three steps to transform your team&apos;s AI from generic NPC to legendary companion
          </p>
        </div>

        <div className="mt-16">
          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-primary/50 via-accent/50 to-transparent lg:block" />

            <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
              {steps.map((step, index) => (
                <div key={step.number} className="relative">
                  {/* Step card */}
                  <div className="flex flex-col items-center text-center">
                    {/* Number badge */}
                    <div className="relative mb-6">
                      <div
                        className={`flex size-16 items-center justify-center rounded-2xl ${step.bgColor}`}
                      >
                        <step.icon className={`size-8 ${step.color}`} />
                      </div>
                      <div className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <p className="mt-3 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

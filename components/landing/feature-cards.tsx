import { Fingerprint, Layers, Wrench, Package } from "lucide-react";

const features = [
  {
    icon: Fingerprint,
    title: "Identity Core",
    badge: "Base Class",
    description:
      "Your team's character sheet. Define voice, priorities, and boundaries that level up every agent you create.",
    color: "text-identity-accent",
    bgColor: "bg-identity-accent/10",
    borderColor: "border-identity-accent/20",
  },
  {
    icon: Layers,
    title: "Roles",
    badge: "Unlockable",
    description:
      "Specialized agents for different missions. Each role inherits your identity and gains XP as it completes tasks.",
    color: "text-roles-accent",
    bgColor: "bg-roles-accent/10",
    borderColor: "border-roles-accent/20",
  },
  {
    icon: Wrench,
    title: "Skills",
    badge: "Abilities",
    description:
      "Equip your roles with powerful actions. Draft, analyze, execute - skills level up through use and unlock new capabilities.",
    color: "text-skills-accent",
    bgColor: "bg-skills-accent/10",
    borderColor: "border-skills-accent/20",
  },
  {
    icon: Package,
    title: "Context Packs",
    badge: "Inventory",
    description:
      "Knowledge items for your party. Brand voice, team lore, project specs - equip them to any role for instant buffs.",
    color: "text-context-accent",
    bgColor: "bg-context-accent/10",
    borderColor: "border-context-accent/20",
  },
];

export function FeatureCards() {
  return (
    <section id="features" className="bg-muted/20 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Your Party&apos;s Arsenal
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            The tools you need to build, level up, and master your AI team
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`group relative overflow-hidden rounded-xl border ${feature.borderColor} bg-card p-6 transition-all hover:shadow-lg hover:shadow-primary/5`}
            >
              {/* Gradient overlay on hover */}
              <div
                className={`absolute inset-0 ${feature.bgColor} opacity-0 transition-opacity group-hover:opacity-100`}
              />

              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className={`inline-flex rounded-lg ${feature.bgColor} p-3`}
                  >
                    <feature.icon className={`size-6 ${feature.color}`} />
                  </div>
                  <span
                    className={`rounded-full ${feature.bgColor} px-2.5 py-1 text-xs font-medium ${feature.color}`}
                  >
                    {feature.badge}
                  </span>
                </div>

                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

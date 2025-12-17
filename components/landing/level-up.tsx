import { Zap, Users, TrendingUp, Brain, Lightbulb, History } from "lucide-react";

export function LevelUp() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            How They{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Level Up
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            The more you use them, the better they get
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {/* Skills Card */}
          <div className="rounded-xl border border-skills-accent/20 bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-skills-accent/10 p-2">
                <Zap className="size-6 text-skills-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Skills</h3>
                <p className="text-sm text-skills-accent">Abilities</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Skills earn XP every time they&apos;re used. Higher levels mean
              faster, more accurate results.
            </p>

            {/* Example skill levels */}
            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span>Email Drafting</span>
                  <span className="font-medium text-skills-accent">LVL 4</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-skills-accent/20">
                  <div className="h-full w-4/5 rounded-full bg-skills-accent" />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span>Code Review</span>
                  <span className="font-medium text-skills-accent">LVL 2</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-skills-accent/20">
                  <div className="h-full w-2/5 rounded-full bg-skills-accent" />
                </div>
              </div>
            </div>
          </div>

          {/* RoleplAIrs Card */}
          <div className="rounded-xl border border-roles-accent/20 bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-roles-accent/10 p-2">
                <Users className="size-6 text-roles-accent" />
              </div>
              <div>
                <h3 className="font-semibold">RoleplAIrs</h3>
                <p className="text-sm text-roles-accent">Personalities</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              RoleplAIrs learn how you want things done. They get better at
              acting the way you expect.
            </p>

            {/* Qualitative improvements */}
            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <Brain className="mt-0.5 size-4 shrink-0 text-roles-accent" />
                <span>Learns your preferences and style</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <History className="mt-0.5 size-4 shrink-0 text-roles-accent" />
                <span>Stores memories from past conversations</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-roles-accent" />
                <span>Suggests new Skills to unlock</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom callout */}
        <div className="mt-12 flex items-center justify-center gap-2 text-center text-muted-foreground">
          <TrendingUp className="size-4 text-primary" />
          <span>
            Every conversation makes your RoleplAIrs smarter and your Skills
            sharper
          </span>
        </div>
      </div>
    </section>
  );
}

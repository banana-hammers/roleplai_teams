import { Fingerprint, Users, BookOpen, Zap, Wrench } from "lucide-react";

export function Anatomy() {
  return (
    <section id="roleplaIrs" className="bg-muted/20 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Anatomy of a{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              RoleplAIr
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            How the pieces fit together
          </p>
        </div>

        {/* Tree Visualization */}
        <div className="mt-16 flex flex-col items-center">
          {/* Identity Core - Top */}
          <div className="relative">
            <div className="flex flex-col items-center">
              <div className="rounded-xl border border-identity-accent/30 bg-identity-accent/10 p-6 transition-transform hover:scale-105">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-identity-accent/20 p-2">
                    <Fingerprint className="size-6 text-identity-accent" />
                  </div>
                  <div>
                    <div className="font-semibold">Identity Core</div>
                    <div className="text-sm text-muted-foreground">
                      Your personality
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-2 max-w-xs text-center text-xs text-muted-foreground">
                Your voice, values, and boundaries. Created once, inherited by
                all your RoleplAIrs.
              </p>
            </div>

            {/* Connector line down */}
            <div className="mx-auto h-8 w-px bg-gradient-to-b from-identity-accent/50 to-roles-accent/50" />
          </div>

          {/* RoleplAIrs - Middle */}
          <div className="relative">
            <div className="flex flex-col items-center">
              <div className="rounded-xl border border-roles-accent/30 bg-roles-accent/10 p-6 transition-transform hover:scale-105">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-roles-accent/20 p-2">
                    <Users className="size-6 text-roles-accent" />
                  </div>
                  <div>
                    <div className="font-semibold">RoleplAIrs</div>
                    <div className="text-sm text-muted-foreground">
                      Your agents
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-2 max-w-xs text-center text-xs text-muted-foreground">
                Specialized versions of you for different tasks — sales,
                support, writing, coding.
              </p>
            </div>

            {/* Connector line down with branches */}
            <div className="mx-auto h-8 w-px bg-gradient-to-b from-roles-accent/50 to-border" />
          </div>

          {/* Branch connector */}
          <div className="relative w-full max-w-md">
            <div className="absolute left-1/2 top-0 h-px w-full -translate-x-1/2 bg-border" />
            <div className="absolute left-[16.67%] top-0 h-4 w-px bg-border" />
            <div className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-border" />
            <div className="absolute right-[16.67%] top-0 h-4 w-px bg-border" />
          </div>

          {/* Bottom row: Lore, Skills, Tools */}
          <div className="mt-4 grid w-full max-w-xl grid-cols-3 gap-4">
            {/* Lore */}
            <div className="flex flex-col items-center">
              <div className="rounded-xl border border-context-accent/30 bg-context-accent/10 p-4 transition-transform hover:scale-105">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="rounded-lg bg-context-accent/20 p-2">
                    <BookOpen className="size-5 text-context-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Lore</div>
                    <div className="text-xs text-muted-foreground">
                      Knowledge
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Context they remember — your bio, brand, docs
              </p>
            </div>

            {/* Skills */}
            <div className="flex flex-col items-center">
              <div className="rounded-xl border border-skills-accent/30 bg-skills-accent/10 p-4 transition-transform hover:scale-105">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="rounded-lg bg-skills-accent/20 p-2">
                    <Zap className="size-5 text-skills-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Skills</div>
                    <div className="text-xs text-muted-foreground">
                      Abilities
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                What they can do — draft emails, review code
              </p>
            </div>

            {/* Tools */}
            <div className="flex flex-col items-center">
              <div className="rounded-xl border border-border/50 bg-muted/50 p-4 transition-transform hover:scale-105">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="rounded-lg bg-muted p-2">
                    <Wrench className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Tools</div>
                    <div className="text-xs text-muted-foreground">
                      Integrations
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                How they act — send emails, create PRs
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

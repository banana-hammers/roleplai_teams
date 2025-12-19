import { Target, Users2, AtSign, CalendarClock, TrendingUp, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Users2,
    title: "Party Up",
    description: "Select 2-5 RoleplAIrs to form your mission team",
  },
  {
    icon: AtSign,
    title: "@Mention & Handoff",
    description: "Direct specific roles or let AI pick the best responder",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description: "AI monitors your goals — you adjust as needed",
  },
  {
    icon: CalendarClock,
    title: "Scheduled Check-ins",
    description: "Daily or weekly tasks to keep momentum going",
  },
];

const exampleTeam = [
  { name: "Research", color: "bg-roles-accent" },
  { name: "Writer", color: "bg-skills-accent" },
  { name: "Strategist", color: "bg-identity-accent" },
  { name: "Editor", color: "bg-context-accent" },
];

export function Missions() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-missions-accent/30 bg-missions-accent/10 px-4 py-1.5 text-sm font-medium text-missions-accent">
            <Target className="size-4" />
            Coming Soon
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Assemble Your{" "}
            <span className="bg-gradient-to-r from-missions-accent to-context-accent bg-clip-text text-transparent">
              Party
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Team up RoleplAIrs for goals that take days, weeks, or months
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* Left: Party Visualization */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-full max-w-sm">
              {/* Mission Goal Card */}
              <div className="rounded-xl border border-missions-accent/30 bg-card p-6 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-missions-accent/20 p-2">
                    <Target className="size-6 text-missions-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Launch Product Campaign</h3>
                    <p className="text-sm text-muted-foreground">4 RoleplAIrs working together</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-missions-accent">45%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-missions-accent/20">
                    <div className="h-full w-[45%] rounded-full bg-missions-accent transition-all" />
                  </div>
                </div>

                {/* Team Avatars */}
                <div className="mt-6">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Mission Team
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {exampleTeam.map((member) => (
                      <div
                        key={member.name}
                        className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5"
                      >
                        <div className={`size-2.5 rounded-full ${member.color}`} />
                        <span className="text-sm">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Handoff Example */}
                <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 p-3">
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-missions-accent" />
                    <div>
                      <span className="font-medium">Writer</span>
                      <span className="text-muted-foreground"> handing off to </span>
                      <span className="font-medium">Editor</span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        "Draft complete. Ready for your review!"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Feature List */}
          <div className="flex flex-col justify-center">
            <div className="grid gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-missions-accent/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-missions-accent/10 p-2">
                      <feature.icon className="size-5 text-missions-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{feature.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
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

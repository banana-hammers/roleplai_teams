import { MessageSquare, Hammer, Sparkles } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Chat with Nova",
    subtitle: "5-minute conversation",
    description:
      "Nova, our AI interviewer, asks a few questions about how you communicate. No forms to fill out — just a natural conversation that captures your voice.",
    color: "text-identity-accent",
    bgColor: "bg-identity-accent/10",
  },
  {
    number: "02",
    icon: Hammer,
    title: "Forge Your RoleplAIr",
    subtitle: "Guided creation",
    description:
      "Tell Forge what you need — an email assistant, research buddy, or coding helper. It builds your first agent with starter Skills already equipped.",
    color: "text-roles-accent",
    bgColor: "bg-roles-accent/10",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Start Talking",
    subtitle: "Instant use",
    description:
      "That's it. Your RoleplAIr is ready. Start chatting and watch it respond with your voice, your style, your way of thinking.",
    color: "text-skills-accent",
    bgColor: "bg-skills-accent/10",
  },
];

export function ConversationalFlow() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Setup Through{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Conversation
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No complex configuration. Just talk.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid gap-8 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connector line for desktop */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-px w-full bg-gradient-to-r from-border to-transparent lg:block" />
                )}

                <div className="flex flex-col items-center text-center">
                  {/* Icon with number */}
                  <div className="relative mb-6">
                    <div
                      className={`flex size-24 items-center justify-center rounded-2xl ${step.bgColor} transition-transform hover:scale-105`}
                    >
                      <step.icon className={`size-10 ${step.color}`} />
                    </div>
                    <div className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className={`mt-1 text-sm font-medium ${step.color}`}>
                    {step.subtitle}
                  </p>
                  <p className="mt-3 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

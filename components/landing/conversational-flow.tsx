import { MessageSquare, Sparkles, Bot } from "lucide-react";

const novaChat = [
  {
    role: "assistant",
    name: "Nova",
    message: "Hey! I'm Nova. Tell me a bit about yourself — what do you do?",
  },
  {
    role: "user",
    message: "I run a small marketing agency. Mostly B2B clients.",
  },
  {
    role: "assistant",
    name: "Nova",
    message:
      "Nice! When you're writing for clients, what's your style? Formal, casual, somewhere in between?",
  },
  {
    role: "user",
    message: "Professional but friendly. I like to keep things clear and actionable.",
  },
  {
    role: "assistant",
    name: "Nova",
    message: "Got it. I've captured your voice. Ready to create your first RoleplAIr?",
  },
];

const forgeChat = [
  {
    role: "user",
    message: "I need help drafting client proposals",
  },
  {
    role: "assistant",
    name: "Forge",
    message:
      "Creating your Proposal Writer... I've added Skills for drafting, research, and pricing. Your Identity Core is already connected.",
  },
];

export function ConversationalFlow() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            As Easy as Having a{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Conversation
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No forms. No configuration. Just talk.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* Left: Nova Chat */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-identity-accent/20">
                <MessageSquare className="size-4 text-identity-accent" />
              </div>
              <span className="font-medium">Chat with Nova</span>
              <span className="text-sm text-muted-foreground">— captures your voice</span>
            </div>
            <div className="rounded-xl border border-identity-accent/20 bg-card p-4">
              <div className="space-y-3">
                {novaChat.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <p className="mb-0.5 text-xs font-medium text-identity-accent">
                          {msg.name}
                        </p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Forge + Result */}
          <div className="space-y-6">
            {/* Forge Chat */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-roles-accent/20">
                  <Bot className="size-4 text-roles-accent" />
                </div>
                <span className="font-medium">Tell Forge what you need</span>
              </div>
              <div className="rounded-xl border border-roles-accent/20 bg-card p-4">
                <div className="space-y-3">
                  {forgeChat.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <p className="mb-0.5 text-xs font-medium text-roles-accent">
                            {msg.name}
                          </p>
                        )}
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Result Card */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-skills-accent/20">
                  <Sparkles className="size-4 text-skills-accent" />
                </div>
                <span className="font-medium">Start using it</span>
              </div>
              <div className="rounded-xl border border-skills-accent/20 bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-roles-accent/20">
                    <Bot className="size-5 text-roles-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Proposal Writer</p>
                    <p className="text-sm text-muted-foreground">
                      Ready with your voice, 3 Skills equipped
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

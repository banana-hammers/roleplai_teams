import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      <main className="flex w-full max-w-5xl flex-col items-center gap-12 px-6 py-24 text-center">
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Roleplai Teams
          </h1>
          <p className="max-w-2xl text-xl text-muted-foreground">
            Level up by extending your identity into purpose-built{" "}
            <span className="font-semibold text-foreground">Roles</span> that can take action safely
          </p>
        </div>

        <div className="flex flex-col gap-8 rounded-xl border bg-card p-8 text-left shadow-sm sm:p-12">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold">🎭 Your Identity</h3>
              <p className="text-sm text-muted-foreground">
                Define your core voice, priorities, and boundaries once
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold">⚡ Purpose-Built Roles</h3>
              <p className="text-sm text-muted-foreground">
                Create agents with scoped access and clear permissions
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold">🔧 Reusable Skills</h3>
              <p className="text-sm text-muted-foreground">
                Save workflows and level them up over time
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/chat">Try Chat Demo</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>

        <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4 text-sm dark:border-green-900 dark:bg-green-950">
          <p className="font-medium">✅ Chat Streaming Ready!</p>
          <p className="mt-1 text-muted-foreground">
            AI SDK integration complete. Try the chat demo above.
          </p>
        </div>
      </main>
    </div>
  );
}

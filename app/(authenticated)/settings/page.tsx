import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      <main className="container px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your account preferences and API keys.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Settings page coming soon. You&apos;ll be able to manage your profile, API keys, and preferences here.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

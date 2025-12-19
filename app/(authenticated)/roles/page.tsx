'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleCard } from '@/components/roles'
import { getUserRoles } from '@/app/actions/roles'
import { Loader2, Plus, MessageSquare } from 'lucide-react'
import type { Role } from '@/types/role'

export default function RolesPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadRoles() {
      const result = await getUserRoles()
      if (result.success) {
        setRoles(result.roles as Role[])
      }
      setIsLoading(false)
    }
    loadRoles()
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      {/* Content */}
      <main className="container px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Your Roles</h1>
        {roles.length === 0 ? (
          /* Empty state */
          <Card className="mx-auto max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-muted p-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">No roles yet</h2>
                  <p className="text-sm text-muted-foreground">
                    Create your first AI role to start chatting with a personalized assistant.
                  </p>
                </div>
                <Button onClick={() => router.push('/roles/create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Role
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Roles grid - Party Select layout */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onSelect={() => router.push(`/roles/${role.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

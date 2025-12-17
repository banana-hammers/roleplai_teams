'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getUserRoles } from '@/app/actions/roles'
import { Loader2, Plus, MessageSquare, Wrench } from 'lucide-react'
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
          /* Roles grid */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <Card
                key={role.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => router.push(`/roles/${role.id}`)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {role.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-2">
                    {role.allowed_tools && role.allowed_tools.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <Wrench className="mr-1 h-3 w-3" />
                        {role.allowed_tools.length} skill{role.allowed_tools.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {role.approval_policy}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

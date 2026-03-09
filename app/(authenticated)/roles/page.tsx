'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RoleCard } from '@/components/roles'
import { getUserRolesWithSkills } from '@/app/actions/roles'
import { Loader2, Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RoleWithSkills } from '@/types/role'

export default function RolesPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<RoleWithSkills[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRoles() {
      const result = await getUserRolesWithSkills()
      if (result.success) {
        setRoles(result.roles as RoleWithSkills[])
      } else {
        console.error('Failed to load roles:', result.error)
        setError(result.error || 'Failed to load roles')
      }
      setIsLoading(false)
    }
    loadRoles()
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="relative">
          <div className="h-12 w-12 rounded-xl bg-primary/20 animate-[orb-breathe_2s_ease-in-out_infinite]" />
          <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-display-md font-display font-bold">Your Roles</h1>
          {roles.length > 0 && (
            <Button
              onClick={() => router.push('/roles/create')}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Role</span>
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
            {error}
          </div>
        )}

        {roles.length === 0 && !error ? (
          /* Enhanced empty state */
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            {/* Animated illustration */}
            <div className="relative mb-8">
              <div className={cn(
                'h-24 w-24 rounded-2xl',
                'bg-linear-to-br from-primary/20 via-primary/10 to-accent/20',
                'flex items-center justify-center',
                'animate-[orb-breathe_3s_ease-in-out_infinite]',
              )}>
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              {/* Orbiting particles */}
              <div className="absolute inset-0 animate-spin-slow">
                <div className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary/50" />
              </div>
              <div className="absolute inset-0 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '12s' }}>
                <div className="absolute top-1/2 -right-2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent/50" />
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold text-center mb-3">
              Create Your First Agent
            </h2>
            <p className="text-muted-foreground text-center max-w-sm mb-8">
              Agents are AI extensions of your identity. They can take actions, answer questions, and grow with you.
            </p>

            <Button
              size="lg"
              onClick={() => router.push('/roles/create')}
              className={cn(
                'gap-2 px-6',
                'bg-linear-to-r from-primary to-primary/80',
                'hover:from-primary/90 hover:to-primary/70',
                'shadow-lg shadow-primary/25',
                'transition-all duration-300',
                'hover:shadow-xl hover:shadow-primary/30',
                'hover:-translate-y-0.5',
              )}
            >
              <Plus className="h-5 w-5" />
              Get Started
            </Button>
          </div>
        ) : (
          /* Roles grid - max 3 columns with breathing room */
          <div className={cn(
            'grid gap-4',
            'grid-cols-1',
            'sm:grid-cols-2 sm:gap-5',
            'lg:grid-cols-3 lg:gap-6',
          )}>
            {roles.map((role, index) => (
              <div
                key={role.id}
                className="animate-slide-up-fade stagger-item"
                style={{ '--stagger': index, animationDelay: `${index * 50}ms` } as React.CSSProperties}
              >
                <RoleCard
                  role={role}
                  onSelect={() => router.push(`/roles/${role.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

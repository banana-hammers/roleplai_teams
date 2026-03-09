'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { UserMenu } from './user-menu'
import { Menu, X, Plus, LayoutDashboard, Settings } from 'lucide-react'

interface NavbarClientProps {
  variant: 'landing' | 'app'
  user: {
    email: string
    fullName?: string | null
    alias?: string | null
  } | null
}

export function NavbarClient({ variant, user }: NavbarClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isAuthenticated = !!user
  const isLandingVariant = variant === 'landing'

  // Landing nav links (only shown on landing/about pages when not authenticated)
  const landingLinks = [
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
  ]

  // App nav links (shown for authenticated users)
  const appLinks = [
    { href: '/roles', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href={isAuthenticated ? '/roles' : '/'} className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-primary">
            Roleplai Teams
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {isAuthenticated ? (
            // Authenticated: show app links
            appLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium transition-colors',
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
              </Link>
            ))
          ) : isLandingVariant ? (
            // Unauthenticated on landing: show landing links
            landingLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))
          ) : null}
        </div>

        {/* Desktop Right Side */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Button asChild size="sm">
                <Link href="/roles/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Role
                </Link>
              </Button>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild variant="gradient" size="sm">
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border/40 bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {isAuthenticated ? (
              <>
                {appLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-2 text-sm font-medium transition-colors',
                      pathname === link.href || pathname.startsWith(link.href + '/')
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.icon && <link.icon className="h-4 w-4" />}
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 border-t border-border/40 pt-4">
                  <Button asChild size="sm">
                    <Link href="/roles/create" onClick={() => setMobileMenuOpen(false)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Role
                    </Link>
                  </Button>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                    <UserMenu user={user} />
                  </div>
                </div>
              </>
            ) : isLandingVariant ? (
              <>
                {landingLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 pt-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild variant="gradient" size="sm">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </header>
  )
}

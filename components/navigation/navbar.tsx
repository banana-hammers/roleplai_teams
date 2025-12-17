import { createClient } from '@/lib/supabase/server'
import { NavbarClient } from './navbar-client'

interface NavbarProps {
  variant?: 'landing' | 'app'
}

export async function Navbar({ variant = 'landing' }: NavbarProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('email, full_name, alias')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <NavbarClient
      variant={variant}
      user={
        user
          ? {
              email: profile?.email || user.email || '',
              fullName: profile?.full_name,
              alias: profile?.alias,
            }
          : null
      }
    />
  )
}

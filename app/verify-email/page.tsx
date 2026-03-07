'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { resendVerificationEmail } from '@/app/actions/auth'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const [resent, setResent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleResend() {
    if (!email) return
    setError(null)
    setLoading(true)

    try {
      const result = await resendVerificationEmail({ email })

      if (result.success) {
        setResent(true)
      } else if (result.error) {
        setError(result.error)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Check Your Email</CardTitle>
        <CardDescription>
          We sent a verification link to{' '}
          {email ? <strong>{email}</strong> : 'your email'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Click the link in your email to verify your account and get started.
        </p>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
            {error}
          </div>
        )}

        {resent && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
            Verification email resent. Check your inbox.
          </div>
        )}

        {email && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={loading || resent}
          >
            {loading ? 'Sending...' : resent ? 'Email Resent' : 'Resend Verification Email'}
          </Button>
        )}

        <div className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Suspense>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}

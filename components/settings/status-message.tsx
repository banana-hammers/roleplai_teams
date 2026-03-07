'use client'

interface StatusMessageProps {
  message: { type: 'success' | 'error'; text: string } | null
}

export function StatusMessage({ message }: StatusMessageProps) {
  if (!message) return null

  return (
    <div
      className={`rounded-lg border p-3 text-sm ${
        message.type === 'success'
          ? 'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100'
          : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100'
      }`}
    >
      {message.text}
    </div>
  )
}

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface StatusMessage {
  type: 'success' | 'error'
  text: string
}

/**
 * Hook for managing a status message that auto-clears after a timeout.
 */
export function useStatusMessage(timeoutMs: number = 3000) {
  const [statusMessage, setStatusMessageState] = useState<StatusMessage | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearStatusMessage = useCallback(() => {
    setStatusMessageState(null)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const setStatusMessage = useCallback((msg: StatusMessage | null) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setStatusMessageState(msg)
    if (msg && msg.type === 'success') {
      timerRef.current = setTimeout(() => {
        setStatusMessageState(null)
        timerRef.current = null
      }, timeoutMs)
    }
  }, [timeoutMs])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { statusMessage, setStatusMessage, clearStatusMessage }
}

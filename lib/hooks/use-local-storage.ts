'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Generic hook for managing state persisted in localStorage.
 * Handles SSR hydration safely by starting with defaultValue
 * and loading from localStorage after mount.
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage after hydration (client-side only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage
        setValue(JSON.parse(saved))
      }
    } catch (error) {
      console.error(`Failed to load ${key} from localStorage:`, error)
    }
    setIsHydrated(true)
  }, [key])

  // Auto-save to localStorage on changes (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.error(`Failed to save ${key} to localStorage:`, error)
      }
    }
  }, [value, isHydrated, key])

  // Remove the key from localStorage
  const removeValue = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key)
    }
    setValue(defaultValue)
  }, [key, defaultValue])

  return { value, setValue, isHydrated, removeValue }
}

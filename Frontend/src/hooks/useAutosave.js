import { useEffect, useRef, useState } from 'react'

export function useAutosave(value, save, enabled = true, delay = 900) {
  const firstRun = useRef(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!enabled) return undefined
    if (firstRun.current) {
      firstRun.current = false
      return undefined
    }

    const timer = window.setTimeout(async () => {
      setSaving(true)
      setError('')
      try {
        await save(value)
        setSavedAt(new Date())
      } catch (saveError) {
        setError(saveError.message || 'Autosave failed')
      } finally {
        setSaving(false)
      }
    }, delay)

    return () => window.clearTimeout(timer)
  }, [delay, enabled, save, value])

  return { saving, savedAt, error }
}

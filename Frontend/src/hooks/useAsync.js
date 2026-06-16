import { useCallback, useState } from 'react'

export function useAsync() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = useCallback(async (task) => {
    setLoading(true)
    setError('')
    try {
      return await task()
    } catch (taskError) {
      setError(taskError.message || 'Something went wrong')
      throw taskError
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, setError, run }
}

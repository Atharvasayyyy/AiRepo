import { useCallback, useEffect, useMemo, useState } from 'react'
import { getToken, removeToken } from '../api/http'
import { authService } from '../services/authService'
import { AuthContext } from './authContextObject'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setTokenState] = useState(getToken())
  const [loading, setLoading] = useState(Boolean(getToken()))
  const [error, setError] = useState('')

  const fetchProfile = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return null
    }

    setLoading(true)
    setError('')
    try {
      const profile = await authService.profile()
      setUser(profile?.user || profile)
      return profile?.user || profile
    } catch (profileError) {
      setError(profileError.message || 'Unable to load profile')
      removeToken()
      setTokenState('')
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchProfile()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [fetchProfile])

  const login = useCallback(
    async (credentials) => {
      setLoading(true)
      setError('')
      try {
        const data = await authService.login(credentials)
        setTokenState(data?.token || getToken())
        const profile = await fetchProfile()
        setUser(profile || data?.user || null)
        return data
      } catch (loginError) {
        setError(loginError.message || 'Login failed')
        throw loginError
      } finally {
        setLoading(false)
      }
    },
    [fetchProfile],
  )

  const register = useCallback(async (payload) => {
    setLoading(true)
    setError('')
    try {
      return await authService.register(payload)
    } catch (registerError) {
      setError(registerError.message || 'Registration failed')
      throw registerError
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await authService.logout()
    } finally {
      removeToken()
      setTokenState('')
      setUser(null)
      setLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (payload) => {
    setLoading(true)
    setError('')
    try {
      await authService.updateProfile(payload)
      return await fetchProfile()
    } catch (profileError) {
      setError(profileError.message || 'Unable to update profile')
      throw profileError
    } finally {
      setLoading(false)
    }
  }, [fetchProfile])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      fetchProfile,
      updateProfile,
    }),
    [error, fetchProfile, loading, login, logout, register, token, updateProfile, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

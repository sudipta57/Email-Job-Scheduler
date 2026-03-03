'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getMe } from '@/lib/api'
import type { User } from '@/types'

type AuthContextValue = {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setToken: (token: string) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    setLoading(true)
    try {
      const me = await getMe()
      setUser(me)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const setToken = useCallback((token: string) => {
    localStorage.setItem('auth_token', token)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      void loadUser()
    } else {
      setLoading(false)
    }
  }, [loadUser])

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      setToken,
    }),
    [user, loading, setToken]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

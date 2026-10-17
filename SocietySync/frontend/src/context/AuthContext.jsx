import { createContext, useContext, useEffect, useState } from 'react'
import client, { setTokens, clearTokens, getRefreshToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On every fresh app load (refresh, reopen after days, new tab) we only have the
  // refresh token in localStorage - this silently exchanges it for a new access token
  // so the person never sees a login screen unless that refresh token is actually gone.
  useEffect(() => {
    async function restoreSession() {
      const rt = getRefreshToken()
      if (!rt) {
        setLoading(false)
        return
      }
      try {
        const res = await client.post('/api/auth/refresh', { refreshToken: rt })
        setTokens(res.data)
        setUser(res.data)
      } catch {
        clearTokens()
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  async function login(loginId, password) {
    const res = await client.post('/api/auth/login', { loginId, password })
    setTokens(res.data)
    setUser(res.data)
    return res.data
  }

  async function logout() {
    try {
      await client.post('/api/auth/logout')
    } catch {
      // best-effort - clear local state regardless
    }
    clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

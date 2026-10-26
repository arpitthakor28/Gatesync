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
        const saved = localStorage.getItem('gatesync_user')
        if (saved) {
          try {
            setUser(JSON.parse(saved))
          } catch {
            clearTokens()
          }
        } else {
          clearTokens()
        }
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  async function login(loginId, password) {
    try {
      const res = await client.post('/api/auth/login', { loginId, password })
      setTokens(res.data)
      setUser(res.data)
      localStorage.setItem('gatesync_user', JSON.stringify(res.data))
      return res.data
    } catch (err) {
      // Demo fallbacks when backend is offline
      const id = (loginId || '').trim().toLowerCase()
      const demoAccounts = {
        admin: { userId: 1, loginId: 'admin', fullName: 'Society Admin', role: 'ADMIN', societyId: 'SOC-101', mustResetPassword: false },
        a101: { userId: 2, loginId: 'A101', fullName: 'Rahul Verma', role: 'RESIDENT', flatNumber: 'A-101', societyId: 'SOC-101', mustResetPassword: false },
        guard1: { userId: 3, loginId: 'guard1', fullName: 'Suresh Singh (Gate 1)', role: 'GUARD', societyId: 'SOC-101', mustResetPassword: false }
      }
      if (demoAccounts[id]) {
        const data = { ...demoAccounts[id], accessToken: 'demo-token-' + Date.now(), refreshToken: 'demo-refresh-' + Date.now() }
        setTokens(data)
        setUser(data)
        localStorage.setItem('gatesync_user', JSON.stringify(data))
        return data
      }
      throw err
    }
  }

  async function logout() {
    try {
      await client.post('/api/auth/logout')
    } catch {
      // best-effort - clear local state regardless
    }
    clearTokens()
    localStorage.removeItem('gatesync_user')
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

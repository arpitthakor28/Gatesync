import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

const client = axios.create({ baseURL: API_BASE })

// Access token lives in memory (safer against XSS than localStorage); refresh token is
// the one thing persisted, since it's what makes "log in once" survive a page reload
// or the app being closed and reopened days later.
let accessToken = null
let refreshToken = localStorage.getItem('refreshToken')

export function setTokens({ accessToken: at, refreshToken: rt }) {
  accessToken = at
  if (rt) {
    refreshToken = rt
    localStorage.setItem('refreshToken', rt)
  }
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  localStorage.removeItem('refreshToken')
}

export function getRefreshToken() {
  return refreshToken
}

client.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

let refreshingPromise = null

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && refreshToken) {
      original._retry = true
      try {
        if (!refreshingPromise) {
          refreshingPromise = axios
            .post(`${API_BASE}/api/auth/refresh`, { refreshToken })
            .then((res) => {
              setTokens(res.data)
              return res.data
            })
            .finally(() => {
              refreshingPromise = null
            })
        }
        const data = await refreshingPromise
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return client(original)
      } catch (refreshError) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export default client

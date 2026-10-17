import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await login(loginId, password)
      if (res.mustResetPassword) {
        navigate('/reset-password')
        return
      }
      if (res.role === 'ADMIN') navigate('/admin')
      else if (res.role === 'GUARD') navigate('/guard')
      else navigate('/resident')
    } catch {
      setError('Invalid login ID or password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      maxWidth: 400,
      margin: '80px auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(186, 230, 253, 0.85)',
      borderRadius: 24,
      padding: '36px 32px',
      boxShadow: '0 20px 50px rgba(14, 165, 233, 0.15), 0 4px 12px rgba(12, 30, 51, 0.04)'
    }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, background: 'linear-gradient(135deg, #0c1e33 0%, #0284c7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        GateSync
      </h1>
      <p style={{ color: '#47617d', marginBottom: 24, fontSize: 14 }}>Sign in to access your portal</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input
          placeholder="Login ID (e.g. admin, A101, guard1)"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        {error && <div style={{ color: '#dc2626', fontSize: 14, fontWeight: 500 }}>{error}</div>}
        <button disabled={busy} type="submit" style={btnStyle}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p style={{ marginTop: 24, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
        Default admin: <code>admin</code> / <code>admin123</code> (forced reset on first login)
      </p>
    </div>
  )
}

const inputStyle = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(186, 230, 253, 0.85)',
  backgroundColor: '#ffffff',
  fontSize: 14,
  outline: 'none',
  transition: 'all 0.15s ease'
}

const btnStyle = {
  padding: '12px 0',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
  color: '#ffffff',
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
  boxShadow: '0 6px 20px rgba(14, 165, 233, 0.4)',
  transition: 'all 0.15s ease'
}

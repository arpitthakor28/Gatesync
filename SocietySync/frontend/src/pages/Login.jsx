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
    <div style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>GateSync</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Sign in to continue</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
        {error && <div style={{ color: '#dc2626', fontSize: 14 }}>{error}</div>}
        <button disabled={busy} type="submit" style={btnStyle}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p style={{ marginTop: 20, fontSize: 12, color: '#94a3b8' }}>
        Default admin: <code>admin</code> / <code>admin123</code> (forced reset on first login)
      </p>
    </div>
  )
}

const inputStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }
const btnStyle = {
  padding: '11px 0', borderRadius: 8, border: 'none', background: '#1e40af',
  color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer'
}

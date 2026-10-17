import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setBusy(true)
    try {
      await client.post('/api/auth/reset-password', { newPassword: password })
      if (user?.role === 'ADMIN') navigate('/admin')
      else if (user?.role === 'GUARD') navigate('/guard')
      else navigate('/resident')
    } catch {
      setError('Could not update password - please try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Set a new password</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Required on first login for security.</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        {error && <div style={{ color: '#dc2626', fontSize: 14 }}>{error}</div>}
        <button disabled={busy} type="submit" style={btnStyle}>
          {busy ? 'Saving…' : 'Save and continue'}
        </button>
      </form>
    </div>
  )
}

const inputStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }
const btnStyle = { padding: '11px 0', borderRadius: 8, border: 'none', background: '#1e40af', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer' }

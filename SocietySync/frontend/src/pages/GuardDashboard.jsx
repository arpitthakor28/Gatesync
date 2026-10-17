import { useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useVisitorSocket } from '../hooks/useVisitorSocket'

export default function GuardDashboard() {
  const { user, logout } = useAuth()
  const [form, setForm] = useState({ visitorName: '', visitorPhone: '', purpose: '', flatNumber: '' })
  const [log, setLog] = useState([])
  const [sending, setSending] = useState(false)

  // Live feed of resident decisions on requests this guard created - no refresh needed.
  useVisitorSocket(user ? `/topic/guard/${user.loginId}` : null, (updated) => {
    setLog((prev) => {
      const others = prev.filter((r) => r.id !== updated.id)
      return [updated, ...others]
    })
  })

  async function submit(e) {
    e.preventDefault()
    setSending(true)
    try {
      const res = await client.post('/api/guard/visitor-requests', form)
      setLog((prev) => [res.data, ...prev])
      setForm({ visitorName: '', visitorPhone: '', purpose: '', flatNumber: '' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>Gate — {user?.fullName}</h2>
        <button onClick={logout} style={linkBtn}>Log out</button>
      </header>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        <input required placeholder="Visitor name" value={form.visitorName}
               onChange={(e) => setForm({ ...form, visitorName: e.target.value })} style={inputStyle} />
        <input placeholder="Visitor phone (optional)" value={form.visitorPhone}
               onChange={(e) => setForm({ ...form, visitorPhone: e.target.value })} style={inputStyle} />
        <input placeholder="Purpose (optional)" value={form.purpose}
               onChange={(e) => setForm({ ...form, purpose: e.target.value })} style={inputStyle} />
        <input required placeholder="Flat number (e.g. A101)" value={form.flatNumber}
               onChange={(e) => setForm({ ...form, flatNumber: e.target.value })} style={inputStyle} />
        <button disabled={sending} type="submit" style={btnStyle}>
          {sending ? 'Sending…' : 'Send entry request'}
        </button>
      </form>

      <h3 style={{ fontSize: 15, color: '#475569' }}>Recent requests</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {log.map((r) => (
          <div key={r.id} style={rowStyle}>
            <div>
              <strong>{r.visitorName}</strong> → {r.flatNumber}
            </div>
            <span style={statusBadge(r.status)}>{r.status}</span>
          </div>
        ))}
        {log.length === 0 && <div style={{ color: '#94a3b8', fontSize: 14 }}>No requests yet.</div>}
      </div>
    </div>
  )
}

function statusBadge(status) {
  const colors = {
    PENDING: '#f59e0b', APPROVED: '#16a34a', REJECTED: '#dc2626', EXPIRED: '#94a3b8'
  }
  return {
    fontSize: 12, fontWeight: 700, color: '#fff', padding: '3px 8px',
    borderRadius: 999, background: colors[status] || '#64748b'
  }
}

const inputStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }
const btnStyle = {
  padding: '11px 0', borderRadius: 8, border: 'none', background: '#1e40af',
  color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer'
}
const linkBtn = { border: 'none', background: 'none', color: '#1e40af', cursor: 'pointer' }
const rowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10
}

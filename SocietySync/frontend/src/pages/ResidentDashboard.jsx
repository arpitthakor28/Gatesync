import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import VisitorApprovalPopup from '../components/VisitorApprovalPopup'

export default function ResidentDashboard() {
  const { user, logout } = useAuth()
  const [bills, setBills] = useState([])

  useEffect(() => {
    if (user?.flatNumber) loadBills()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadBills() {
    const res = await client.get('/api/resident/bills', { params: { flatNumber: user.flatNumber } })
    setBills(res.data)
  }

  // Placeholder for a real payment gateway (Razorpay/Stripe/etc). This is the online
  // path that the original app was missing - only cash-by-admin existed before.
  async function payOnline(billId) {
    await client.post(`/api/resident/bills/${billId}/mark-paid-online`)
    loadBills()
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
      <VisitorApprovalPopup flatNumber={user?.flatNumber} />

      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>{user?.fullName} — Flat {user?.flatNumber}</h2>
        <button onClick={logout} style={linkBtn}>Log out</button>
      </header>

      <h3 style={{ fontSize: 15, color: '#475569' }}>Maintenance bills</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bills.map((b) => (
          <div key={b.id} style={rowStyle}>
            <div>
              <strong>{b.billingMonth}</strong> — ₹{b.amount}
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {b.status === 'PAID' ? `Paid via ${b.paymentMethod}` : 'Pending'}
              </div>
            </div>
            {b.status !== 'PAID' && (
              <button onClick={() => payOnline(b.id)} style={payBtn}>Pay online</button>
            )}
          </div>
        ))}
        {bills.length === 0 && <div style={{ color: '#94a3b8', fontSize: 14 }}>No bills yet.</div>}
      </div>
    </div>
  )
}

const linkBtn = { border: 'none', background: 'none', color: '#1e40af', cursor: 'pointer' }
const rowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '12px', border: '1px solid #e2e8f0', borderRadius: 10
}
const payBtn = {
  padding: '8px 14px', borderRadius: 8, border: 'none',
  background: '#16a34a', color: '#fff', fontWeight: 600, cursor: 'pointer'
}

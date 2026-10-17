import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [bills, setBills] = useState([])
  const [billForm, setBillForm] = useState({ flatNumber: '', billingMonth: '', amount: '' })
  const [residentForm, setResidentForm] = useState({ flatNumber: '', fullName: '', mobile: '' })
  const [guardForm, setGuardForm] = useState({ loginId: '', fullName: '', mobile: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadBills()
  }, [])

  async function loadBills() {
    const res = await client.get('/api/admin/bills')
    setBills(res.data)
  }

  async function generateBills(e) {
    e.preventDefault()
    await client.post('/api/admin/bills/generate', {
      flatNumber: billForm.flatNumber || null,
      billingMonth: billForm.billingMonth,
      amount: Number(billForm.amount)
    })
    setBillForm({ flatNumber: '', billingMonth: '', amount: '' })
    loadBills()
  }

  // This is the other half of the billing fix: admin can now ALSO close out a bill
  // collected as physical cash, alongside the resident's own online-payment option.
  async function markCashPaid(billId) {
    await client.post('/api/admin/bills/mark-cash-paid', { billId })
    loadBills()
  }

  async function addResident(e) {
    e.preventDefault()
    const res = await client.post('/api/admin/residents', residentForm)
    setMessage(`Resident added. Login ID: ${res.data.loginId} (temp password = last 6 digits of mobile)`)
    setResidentForm({ flatNumber: '', fullName: '', mobile: '' })
  }

  async function addGuard(e) {
    e.preventDefault()
    await client.post('/api/admin/guards', guardForm)
    setMessage(`Guard added. Login ID: ${guardForm.loginId} (temp password = last 6 digits of mobile)`)
    setGuardForm({ loginId: '', fullName: '', mobile: '' })
  }

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>Admin — {user?.fullName}</h2>
        <button onClick={logout} style={linkBtn}>Log out</button>
      </header>

      {message && <div style={noticeStyle}>{message}</div>}

      <section style={sectionStyle}>
        <h3>Generate bills</h3>
        <form onSubmit={generateBills} style={rowForm}>
          <input placeholder="Flat # (blank = all flats)" value={billForm.flatNumber}
                 onChange={(e) => setBillForm({ ...billForm, flatNumber: e.target.value })} style={inputStyle} />
          <input required placeholder="Month (2026-09)" value={billForm.billingMonth}
                 onChange={(e) => setBillForm({ ...billForm, billingMonth: e.target.value })} style={inputStyle} />
          <input required type="number" placeholder="Amount" value={billForm.amount}
                 onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })} style={inputStyle} />
          <button type="submit" style={btnStyle}>Generate</button>
        </form>
      </section>

      <section style={sectionStyle}>
        <h3>All bills</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bills.map((b) => (
            <div key={b.id} style={rowStyle}>
              <div>
                <strong>{b.flatNumber}</strong> — {b.billingMonth} — ₹{b.amount}
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {b.status === 'PAID' ? `Paid via ${b.paymentMethod}` : 'Pending'}
                </div>
              </div>
              {b.status !== 'PAID' && (
                <button onClick={() => markCashPaid(b.id)} style={btnStyleSm}>Mark cash paid</button>
              )}
            </div>
          ))}
          {bills.length === 0 && <div style={{ color: '#94a3b8', fontSize: 14 }}>No bills yet.</div>}
        </div>
      </section>

      <section style={sectionStyle}>
        <h3>Add resident</h3>
        <form onSubmit={addResident} style={rowForm}>
          <input required placeholder="Flat #" value={residentForm.flatNumber}
                 onChange={(e) => setResidentForm({ ...residentForm, flatNumber: e.target.value })} style={inputStyle} />
          <input required placeholder="Full name" value={residentForm.fullName}
                 onChange={(e) => setResidentForm({ ...residentForm, fullName: e.target.value })} style={inputStyle} />
          <input required placeholder="Mobile" value={residentForm.mobile}
                 onChange={(e) => setResidentForm({ ...residentForm, mobile: e.target.value })} style={inputStyle} />
          <button type="submit" style={btnStyle}>Add</button>
        </form>
      </section>

      <section style={sectionStyle}>
        <h3>Add guard</h3>
        <form onSubmit={addGuard} style={rowForm}>
          <input required placeholder="Login ID" value={guardForm.loginId}
                 onChange={(e) => setGuardForm({ ...guardForm, loginId: e.target.value })} style={inputStyle} />
          <input required placeholder="Full name" value={guardForm.fullName}
                 onChange={(e) => setGuardForm({ ...guardForm, fullName: e.target.value })} style={inputStyle} />
          <input required placeholder="Mobile" value={guardForm.mobile}
                 onChange={(e) => setGuardForm({ ...guardForm, mobile: e.target.value })} style={inputStyle} />
          <button type="submit" style={btnStyle}>Add</button>
        </form>
      </section>
    </div>
  )
}

const linkBtn = { border: 'none', background: 'none', color: '#1e40af', cursor: 'pointer' }
const sectionStyle = { marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #e2e8f0' }
const rowForm = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }
const inputStyle = { padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, flex: 1, minWidth: 120 }
const btnStyle = { padding: '9px 16px', borderRadius: 8, border: 'none', background: '#1e40af', color: '#fff', fontWeight: 600, cursor: 'pointer' }
const btnStyleSm = { padding: '6px 10px', borderRadius: 8, border: 'none', background: '#334155', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10 }
const noticeStyle = { padding: '10px 14px', background: '#eff6ff', color: '#1e40af', borderRadius: 8, marginBottom: 20, fontSize: 14 }

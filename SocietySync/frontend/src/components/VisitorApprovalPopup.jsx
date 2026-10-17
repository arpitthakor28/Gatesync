import { useEffect, useState } from 'react'
import client from '../api/client'
import { useVisitorSocket } from '../hooks/useVisitorSocket'

/**
 * Mount this once inside the resident's dashboard. It listens on the resident's own
 * flat channel and throws up a full-screen alert the moment a guard logs a visitor -
 * this is the "request popup approved by resident" behavior you asked for.
 */
export default function VisitorApprovalPopup({ flatNumber }) {
  const [queue, setQueue] = useState([])
  const current = queue[0]

  useVisitorSocket(flatNumber ? `/topic/visitor/${flatNumber}` : null, (visitorRequest) => {
    setQueue((q) => [...q, visitorRequest])
    // Best-effort native notification too, in case the tab isn't focused.
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Visitor at the gate', {
        body: `${visitorRequest.visitorName} wants to enter`
      })
    }
  })

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  async function respond(approved) {
    if (!current) return
    await client.post('/api/resident/visitor-requests/decision', {
      requestId: current.id,
      approved
    })
    setQueue((q) => q.slice(1))
  }

  if (!current) return null

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>VISITOR AT THE GATE</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{current.visitorName}</div>
        {current.purpose && <div style={{ color: '#334155', marginBottom: 12 }}>{current.purpose}</div>}
        {current.visitorPhone && (
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>{current.visitorPhone}</div>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => respond(false)} style={rejectBtn}>Reject</button>
          <button onClick={() => respond(true)} style={approveBtn}>Approve entry</button>
        </div>
        {queue.length > 1 && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
            +{queue.length - 1} more waiting
          </div>
        )}
      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
}

const cardStyle = {
  background: '#fff', borderRadius: 16, padding: '28px 24px', width: 320,
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center'
}

const approveBtn = {
  flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
  background: '#16a34a', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer'
}

const rejectBtn = {
  flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid #e2e8f0',
  background: '#fff', color: '#334155', fontWeight: 600, fontSize: 15, cursor: 'pointer'
}

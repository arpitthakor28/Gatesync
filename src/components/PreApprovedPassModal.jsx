import React, { useState } from 'react';
import { passApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  QrCode,
  Key,
  X,
  Share2,
  Copy,
  Check,
  Calendar,
  Clock,
  Car,
  User,
  Package
} from 'lucide-react';

export const PreApprovedPassModal = ({ isOpen, onClose }) => {
  const { user, flatNumber } = useAuth();

  const [form, setForm] = useState({
    visitorName: '',
    visitorPhone: '',
    vehicleNumber: '',
    category: 'GUEST',
    validityHours: 4,
    leaveAtGate: false
  });

  const [generatedPass, setGeneratedPass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await passApi.createPass(form);
      setGeneratedPass(res);
    } catch (err) {
      alert('Could not generate pass: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedPass) return;
    const text = `GateSync Security Entry Pass for Flat ${flatNumber || 'A-101'}\nVisitor: ${generatedPass.visitorName}\nPass Code: ${generatedPass.passCode}\nShow this 6-digit code or QR code at the main security gate desk for instant entry clearance.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(12, 30, 51, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div className="glass-card" style={{
        maxWidth: '520px',
        width: '100%',
        backgroundColor: 'var(--bg-dark-modal, #ffffff)',
        borderRadius: '24px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 25px 60px rgba(14, 165, 233, 0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(14, 165, 233, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary, #0284c7)'
            }}>
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main, #0c1e33)' }}>
                {generatedPass ? 'Gate Entry Pass Generated' : 'Create Pre-Approved Gate Pass'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                Flat {flatNumber || 'A-101'} • Instant Entry Clearance
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ minHeight: '38px', minWidth: '38px', borderRadius: '50%', padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        {!generatedPass ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="form-label">Visitor / Guest / Delivery Name</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar / Zomato Rider"
                required
                value={form.visitorName}
                onChange={e => setForm({ ...form, visitorName: e.target.value })}
                className="form-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="form-select"
                >
                  <option value="GUEST">Personal Guest</option>
                  <option value="SWIGGY">Food Delivery (Swiggy/Zomato)</option>
                  <option value="AMAZON">Courier / Package Delivery</option>
                  <option value="CAB">Cab Driver (Uber/Ola)</option>
                  <option value="SERVICE">Home Technician / Service</option>
                </select>
              </div>

              <div>
                <label className="form-label">Pass Validity</label>
                <select
                  value={form.validityHours}
                  onChange={e => setForm({ ...form, validityHours: Number(e.target.value) })}
                  className="form-select"
                >
                  <option value={2}>Valid for 2 Hours</option>
                  <option value={4}>Valid for 4 Hours</option>
                  <option value={8}>Valid for 8 Hours</option>
                  <option value={24}>Valid for 24 Hours</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Visitor Mobile (Optional)</label>
                <input
                  type="text"
                  placeholder="10-digit mobile"
                  value={form.visitorPhone}
                  onChange={e => setForm({ ...form, visitorPhone: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Vehicle No. (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. GJ-01-AB-1234"
                  value={form.vehicleNumber}
                  onChange={e => setForm({ ...form, vehicleNumber: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '14px',
              backgroundColor: 'var(--bg-dark-input, rgba(0,0,0,0.03))',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={form.leaveAtGate}
                onChange={e => setForm({ ...form, leaveAtGate: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary, #0284c7)' }}
              />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main, #0c1e33)' }}>
                  Auto-Approve "Leave at Gate Desk"
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                  Allows delivery agent to drop parcel with the security guard without ringing intercom
                </div>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ minHeight: '48px', borderRadius: '16px', fontWeight: 800, marginTop: '8px' }}
            >
              {loading ? 'Generating Code...' : 'Generate 6-Digit Pass Code'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', textAlign: 'center' }}>
            
            {/* 6-Digit OTP Badge */}
            <div style={{
              padding: '16px 28px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(56, 189, 248, 0.25) 100%)',
              border: '2px dashed var(--color-primary, #0284c7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary, #0284c7)', textTransform: 'uppercase' }}>
                Instant Security Entry Code
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '0.15em', color: 'var(--text-main, #0c1e33)' }}>
                {generatedPass.passCode}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                Valid for {generatedPass.visitorName} • Flat {flatNumber || 'A-101'}
              </span>
            </div>

            {/* QR Simulation Card */}
            <div style={{
              width: '160px',
              height: '160px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '12px',
              boxShadow: '0 4px 18px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <QrCode size={110} style={{ color: '#0f172a' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>Scan at Gate Desk</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button
                onClick={handleCopy}
                className="btn btn-secondary"
                style={{ flex: 1, minHeight: '44px', borderRadius: '14px', gap: '8px' }}
              >
                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Pass</>}
              </button>

              <button
                onClick={() => {
                  const text = `GateSync Pass for Flat ${flatNumber || 'A-101'}: Code ${generatedPass.passCode}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="btn btn-success"
                style={{ flex: 1, minHeight: '44px', borderRadius: '14px', gap: '8px' }}
              >
                <Share2 size={16} /> Share via WhatsApp
              </button>
            </div>

            <button
              onClick={() => setGeneratedPass(null)}
              className="btn btn-sm"
              style={{ background: 'none', border: 'none', color: 'var(--color-primary, #0284c7)', cursor: 'pointer', fontWeight: 700 }}
            >
              + Create Another Pass
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { passApi } from '../api/client';
import {
  Scan,
  KeyRound,
  CheckCircle2,
  XCircle,
  X,
  Package,
  Building,
  UserCheck
} from 'lucide-react';

export const PassScannerModal = ({ isOpen, onClose, onPassVerified }) => {
  const [passCode, setPassCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!passCode || passCode.trim().length === 0) return;

    setVerifying(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await passApi.verifyPass(passCode.trim());
      setResult(res);
      if (onPassVerified) {
        onPassVerified(res);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Pass invalid or expired');
    } finally {
      setVerifying(false);
    }
  };

  const reset = () => {
    setPassCode('');
    setResult(null);
    setErrorMsg(null);
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
        maxWidth: '460px',
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
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-warning, #f59e0b)'
            }}>
              <Scan size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main, #0c1e33)' }}>
                Gate Desk Pass Verification
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                Scan QR or enter 6-digit resident OTP
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ minHeight: '38px', minWidth: '38px', borderRadius: '50%', padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        {!result ? (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="form-label">Enter 6-Digit Pass Code / OTP</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #64748b)' }} />
                <input
                  type="text"
                  placeholder="e.g. 542891"
                  required
                  maxLength={10}
                  value={passCode}
                  onChange={e => setPassCode(e.target.value)}
                  className="form-input"
                  style={{
                    paddingLeft: '42px',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textAlign: 'center',
                    minHeight: '52px'
                  }}
                  autoFocus
                />
              </div>
            </div>

            {errorMsg && (
              <div style={{
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--color-danger, #ef4444)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <XCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="btn btn-warning"
              style={{ minHeight: '48px', borderRadius: '16px', fontWeight: 800 }}
            >
              {verifying ? 'Validating Pass...' : 'Verify & Authorize Entry'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--color-success, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span className="badge badge-success" style={{ marginBottom: '8px' }}>
                ACCESS GRANTED • CLEARANCE VERIFIED
              </span>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main, #0c1e33)' }}>
                {result.visitorName}
              </h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted, #64748b)', fontSize: '0.85rem' }}>
                Destination: <strong>Flat {result.flatNumber}</strong> ({result.category})
              </p>
            </div>

            {result.leaveAtGate && (
              <div style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontSize: '0.82rem',
                color: 'var(--color-warning, #f59e0b)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <Package size={16} /> Package Left at Gate Desk (Auto-Approved)
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '8px' }}>
              <button
                onClick={reset}
                className="btn btn-secondary"
                style={{ flex: 1, minHeight: '44px', borderRadius: '14px' }}
              >
                Scan Next Pass
              </button>
              <button
                onClick={onClose}
                className="btn btn-primary"
                style={{ flex: 1, minHeight: '44px', borderRadius: '14px' }}
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

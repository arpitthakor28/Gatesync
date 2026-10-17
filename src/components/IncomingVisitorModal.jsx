import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Phone,
  Car,
  Building,
  Clock,
  Volume2,
  AlertTriangle
} from 'lucide-react';

export const IncomingVisitorModal = () => {
  const { incomingVisitor, decideVisitor, closeIncomingModal } = useNotifications();

  const [timeLeft, setTimeLeft] = useState(60);
  const [showDenialInput, setShowDenialInput] = useState(false);
  const [denialReason, setDenialReason] = useState('Not expecting visitors right now');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!incomingVisitor) {
      setTimeLeft(60);
      setShowDenialInput(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          closeIncomingModal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [incomingVisitor, closeIncomingModal]);

  if (!incomingVisitor) return null;

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await decideVisitor(incomingVisitor.id, true);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    try {
      await decideVisitor(incomingVisitor.id, false, denialReason);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const photo = incomingVisitor.photoUrl ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(10, 25, 47, 0.88)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
      animation: 'fadeIn 0.25s ease-out'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: 'var(--bg-dark-modal, #ffffff)',
        borderRadius: '28px',
        border: '2px solid rgba(14, 165, 233, 0.4)',
        boxShadow: '0 25px 70px rgba(14, 165, 233, 0.35), 0 0 40px rgba(14, 165, 233, 0.2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Countdown Progress Bar */}
        <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(14, 165, 233, 0.15)' }}>
          <div style={{
            width: `${(timeLeft / 60) * 100}%`,
            height: '100%',
            backgroundColor: timeLeft < 15 ? 'var(--color-danger, #ef4444)' : 'var(--color-primary, #0284c7)',
            transition: 'width 1s linear'
          }} />
        </div>

        {/* Header Alert Bar */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(56, 189, 248, 0.08) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-glass, rgba(255, 255, 255, 0.1))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="pulse-dot" style={{ backgroundColor: 'var(--color-primary, #0284c7)' }} />
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main, #0c1e33)', letterSpacing: '0.02em' }}>
              GATE INTERCOM CALL
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-primary, #0284c7)', fontWeight: 700 }}>
            <Volume2 size={16} />
            <span>Ringing ({timeLeft}s)</span>
          </div>
        </div>

        {/* Visitor Dossier Body */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Photo & Visitor Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
              <img
                src={photo}
                alt={incomingVisitor.visitorName}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '20px',
                  objectFit: 'cover',
                  border: '3px solid var(--color-primary, #0284c7)',
                  boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                background: 'var(--color-primary, #0284c7)',
                color: '#fff',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}>
                <ShieldAlert size={14} />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: 'var(--text-main, #0c1e33)', lineHeight: 1.2 }}>
                {incomingVisitor.visitorName}
              </h3>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '6px',
                padding: '4px 10px',
                borderRadius: '12px',
                backgroundColor: 'rgba(14, 165, 233, 0.12)',
                color: 'var(--color-primary, #0284c7)',
                fontSize: '0.82rem',
                fontWeight: 800
              }}>
                {incomingVisitor.purpose || 'Personal Guest'}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            backgroundColor: 'var(--bg-dark-input, rgba(240, 249, 255, 0.6))',
            padding: '14px',
            borderRadius: '18px',
            border: '1px solid var(--border-glass, rgba(0,0,0,0.06))'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building size={12} /> Target Flat
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main, #0c1e33)', marginTop: '2px' }}>
                Flat {incomingVisitor.flatNumber}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Car size={12} /> Vehicle Number
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main, #0c1e33)', marginTop: '2px' }}>
                {incomingVisitor.vehicleNumber || 'Walking / No Vehicle'}
              </div>
            </div>

            {incomingVisitor.phone && (
              <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>Visitor Mobile:</span>
                <a
                  href={`tel:${incomingVisitor.phone}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--color-primary, #0284c7)',
                    textDecoration: 'none'
                  }}
                >
                  <Phone size={13} /> {incomingVisitor.phone}
                </a>
              </div>
            )}
          </div>

          {/* Denial Reason Selector if Deny was clicked */}
          {showDenialInput && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.2s ease' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-danger, #ef4444)' }}>
                Reason for Denial (shown to guard):
              </label>
              <select
                value={denialReason}
                onChange={e => setDenialReason(e.target.value)}
                className="form-select"
                style={{ borderRadius: '12px', minHeight: '40px' }}
              >
                <option value="Not expecting visitors right now">Not expecting visitors right now</option>
                <option value="Leave package at the gate desk">Leave package at the gate desk</option>
                <option value="Wrong flat number entered">Wrong flat number entered</option>
                <option value="Resident unavailable / Not at home">Resident unavailable / Not at home</option>
              </select>
            </div>
          )}

          {/* Action Buttons (Large 44px+ touch targets) */}
          <div style={{ display: 'grid', gridTemplateColumns: showDenialInput ? '1fr 1fr' : '1fr 1fr', gap: '12px', marginTop: '6px' }}>
            {!showDenialInput ? (
              <>
                <button
                  onClick={() => setShowDenialInput(true)}
                  disabled={submitting}
                  style={{
                    minHeight: '52px',
                    borderRadius: '16px',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    color: 'var(--color-danger, #ef4444)',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    touchAction: 'manipulation'
                  }}
                >
                  <XCircle size={20} /> Deny Entry
                </button>

                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  style={{
                    minHeight: '52px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
                    touchAction: 'manipulation'
                  }}
                >
                  <CheckCircle2 size={20} /> Approve Entry
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowDenialInput(false)}
                  disabled={submitting}
                  className="btn btn-secondary"
                  style={{ minHeight: '52px', borderRadius: '16px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="btn btn-danger"
                  style={{ minHeight: '52px', borderRadius: '16px', fontWeight: 800 }}
                >
                  Confirm Denial
                </button>
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

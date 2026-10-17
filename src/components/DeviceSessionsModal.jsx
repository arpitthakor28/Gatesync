import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Smartphone, Laptop, Globe, Trash2, ShieldCheck, X, RefreshCw } from 'lucide-react';

export const DeviceSessionsModal = ({ isOpen, onClose }) => {
  const { sessions, fetchSessions, revokeSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchSessions().finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRevoke = async (id) => {
    setRevokingId(id);
    try {
      await revokeSession(id);
    } catch (e) {
      alert('Could not revoke device: ' + e.message);
    } finally {
      setRevokingId(null);
    }
  };

  const getDeviceIcon = (info) => {
    const lower = (info || '').toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
      return <Smartphone size={20} style={{ color: 'var(--color-primary)' }} />;
    }
    if (lower.includes('windows') || lower.includes('macintosh') || lower.includes('linux')) {
      return <Laptop size={20} style={{ color: 'var(--color-primary)' }} />;
    }
    return <Globe size={20} style={{ color: 'var(--color-primary)' }} />;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(12, 30, 51, 0.65)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '16px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '24px',
        padding: '24px',
        backgroundColor: 'var(--bg-dark-modal)',
        boxShadow: '0 25px 60px rgba(14, 165, 233, 0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(14, 165, 233, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Active Devices & Sessions
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Manage where your GateSync account is currently logged in
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ minHeight: '44px', minWidth: '44px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-glass)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Logged-in Devices ({sessions.length})
          </span>
          <button
            onClick={() => { setLoading(true); fetchSessions().finally(() => setLoading(false)); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, minHeight: '44px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px', paddingRight: '4px' }}>
          {loading && sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Loading active sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No other active devices found.
            </div>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '16px',
                  backgroundColor: sess.current ? 'rgba(14, 165, 233, 0.08)' : 'var(--bg-dark-input)',
                  border: `1px solid ${sess.current ? 'rgba(14, 165, 233, 0.35)' : 'var(--border-glass)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'var(--bg-dark-sidebar)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getDeviceIcon(sess.deviceInfo)}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {sess.deviceInfo?.split('(')[0] || 'Web Browser'}
                      </span>
                      {sess.current && (
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--color-primary)',
                          color: '#ffffff'
                        }}>
                          Current Device
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      IP: {sess.ipAddress} • Active: {new Date(sess.lastUsedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {!sess.current && (
                  <button
                    disabled={revokingId === sess.id}
                    onClick={() => handleRevoke(sess.id)}
                    className="btn btn-sm"
                    style={{
                      minHeight: '44px',
                      minWidth: '44px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: 'var(--color-danger)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}
                  >
                    <Trash2 size={14} />
                    {revokingId === sess.id ? 'Revoking...' : 'Revoke'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ minHeight: '44px', padding: '0 24px', fontSize: '0.9rem' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

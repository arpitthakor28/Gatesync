import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../api/client';
import { useNotifications } from '../context/NotificationContext';
import {
  Settings,
  Volume2,
  Vibrate,
  Moon,
  ShieldAlert,
  Bell,
  Check,
  X
} from 'lucide-react';

export const NotificationPreferencesModal = ({ isOpen, onClose }) => {
  const { preferences, setPreferences } = useNotifications();
  const [localPrefs, setLocalPrefs] = useState({
    soundEnabled: true,
    vibrationEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    allowVisitors: true,
    allowDeliveries: true,
    allowNotices: true
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      notificationsApi.getPreferences()
        .then(data => {
          if (data) {
            setLocalPrefs(data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await notificationsApi.updatePreferences(localPrefs);
      setPreferences(res);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (e) {
      alert('Could not update preferences: ' + e.message);
    } finally {
      setSaving(false);
    }
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
      zIndex: 999,
      padding: '16px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        backgroundColor: 'var(--bg-dark-modal, #ffffff)',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(14, 165, 233, 0.25)',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(14, 165, 233, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary, #0284c7)'
            }}>
              <Settings size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #0c1e33)' }}>
                Notification Preferences
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', margin: 0 }}>
                Control chime sounds, vibrations, and quiet hours
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ minHeight: '40px', minWidth: '40px', borderRadius: '50%', padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '4px' }}>
          
          {/* Sound & Vibration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
              Sound & Haptics
            </div>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '14px',
              backgroundColor: 'var(--bg-dark-input, rgba(0,0,0,0.03))',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Volume2 size={18} style={{ color: 'var(--color-primary, #0284c7)' }} />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main, #0c1e33)' }}>Intercom Ring Chime</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>Play ringing audio for incoming gate requests</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localPrefs.soundEnabled}
                onChange={e => setLocalPrefs({ ...localPrefs, soundEnabled: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary, #0284c7)' }}
              />
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '14px',
              backgroundColor: 'var(--bg-dark-input, rgba(0,0,0,0.03))',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Vibrate size={18} style={{ color: 'var(--color-primary, #0284c7)' }} />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main, #0c1e33)' }}>Device Vibration</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>Vibrate phone when a visitor arrives</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localPrefs.vibrationEnabled}
                onChange={e => setLocalPrefs({ ...localPrefs, vibrationEnabled: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary, #0284c7)' }}
              />
            </label>
          </div>

          {/* Quiet Hours */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
              Quiet Hours
            </div>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '14px',
              backgroundColor: 'var(--bg-dark-input, rgba(0,0,0,0.03))',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Moon size={18} style={{ color: '#8b5cf6' }} />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main, #0c1e33)' }}>Enable Quiet Hours</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>Silence non-emergency notifications</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localPrefs.quietHoursEnabled}
                onChange={e => setLocalPrefs({ ...localPrefs, quietHoursEnabled: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#8b5cf6' }}
              />
            </label>

            {localPrefs.quietHoursEnabled && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: 'rgba(139, 92, 246, 0.08)'
              }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>Start Time</label>
                  <input
                    type="time"
                    value={localPrefs.quietHoursStart}
                    onChange={e => setLocalPrefs({ ...localPrefs, quietHoursStart: e.target.value })}
                    className="form-input"
                    style={{ minHeight: '38px', borderRadius: '10px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>End Time</label>
                  <input
                    type="time"
                    value={localPrefs.quietHoursEnd}
                    onChange={e => setLocalPrefs({ ...localPrefs, quietHoursEnd: e.target.value })}
                    className="form-input"
                    style={{ minHeight: '38px', borderRadius: '10px' }}
                  />
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.72rem',
              color: 'var(--color-primary, #0284c7)',
              backgroundColor: 'rgba(14, 165, 233, 0.08)',
              padding: '8px 12px',
              borderRadius: '10px'
            }}>
              <ShieldAlert size={14} />
              <span>Critical SOS emergency alerts always bypass quiet hours.</span>
            </div>
          </div>

          {/* Category Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
              Category Filters
            </div>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>Visitor Gate Requests</span>
              <input
                type="checkbox"
                checked={localPrefs.allowVisitors}
                onChange={e => setLocalPrefs({ ...localPrefs, allowVisitors: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary, #0284c7)' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>Delivery & Courier Gate Drop</span>
              <input
                type="checkbox"
                checked={localPrefs.allowDeliveries}
                onChange={e => setLocalPrefs({ ...localPrefs, allowDeliveries: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary, #0284c7)' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>Society Notice Board</span>
              <input
                type="checkbox"
                checked={localPrefs.allowNotices}
                onChange={e => setLocalPrefs({ ...localPrefs, allowNotices: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary, #0284c7)' }}
              />
            </label>
          </div>

        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-glass, rgba(0,0,0,0.06))' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ minHeight: '44px', borderRadius: '14px' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
            style={{ minHeight: '44px', borderRadius: '14px', gap: '8px' }}
          >
            {saveSuccess ? <><Check size={18} /> Saved!</> : 'Save Preferences'}
          </button>
        </div>

      </div>
    </div>
  );
};

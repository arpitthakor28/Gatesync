import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { sosApi } from '../api/client';
import {
  ShieldAlert,
  AlertTriangle,
  X,
  CheckCircle2,
  PhoneCall,
  Volume2
} from 'lucide-react';

export const SosButton = () => {
  const { user, role, flatNumber } = useAuth();
  const { notifications } = useNotifications();

  const [showCountdownModal, setShowCountdownModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [triggering, setTriggering] = useState(false);
  const [activeSosAlert, setActiveSosAlert] = useState(null);

  const countdownIntervalRef = useRef(null);

  const isResident = role === 'RESIDENT' || role === 'member';
  const isGuardOrAdmin = role === 'GUARD' || role === 'ADMIN' || role === 'staff' || role === 'admin';

  // Watch for incoming SOS alerts among notifications
  useEffect(() => {
    const unackedSos = notifications.find(
      n => n.type === 'SOS_ALERT' && n.status !== 'ACTED'
    );
    setActiveSosAlert(unackedSos || null);
  }, [notifications]);

  const handleStartCountdown = () => {
    setCountdown(3);
    setShowCountdownModal(true);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    let current = 3;
    countdownIntervalRef.current = setInterval(() => {
      current -= 1;
      setCountdown(current);
      if (current <= 0) {
        clearInterval(countdownIntervalRef.current);
        executeSosTrigger();
      }
    }, 1000);
  };

  const handleCancel = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setShowCountdownModal(false);
    setCountdown(3);
  };

  const executeSosTrigger = async () => {
    setTriggering(true);
    try {
      await sosApi.trigger(`Medical / Security Emergency at Flat ${flatNumber || 'A-101'}`);
      setShowCountdownModal(false);
      alert('🚨 EMERGENCY SOS SENT: All security guards on duty and society administrators have been alerted with your flat number!');
    } catch (e) {
      alert('Could not send SOS: ' + e.message);
    } finally {
      setTriggering(false);
    }
  };

  const handleAcknowledgeSos = async (alertId) => {
    try {
      await sosApi.acknowledge(alertId);
      setActiveSosAlert(null);
    } catch (e) {
      alert('Could not acknowledge SOS: ' + e.message);
    }
  };

  return (
    <>
      {/* Resident Floating SOS Button */}
      {isResident && (
        <button
          onClick={handleStartCountdown}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            minWidth: '56px',
            minHeight: '56px',
            borderRadius: '28px',
            border: 'none',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45), 0 0 15px rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 20px',
            cursor: 'pointer',
            zIndex: 800,
            fontWeight: 800,
            fontSize: '0.9rem',
            touchAction: 'manipulation',
            animation: 'pulse 2s infinite'
          }}
          title="Emergency SOS Panic Button"
          aria-label="Emergency SOS"
        >
          <ShieldAlert size={22} />
          <span>SOS</span>
        </button>
      )}

      {/* Guard Screen SOS Siren Banner */}
      {isGuardOrAdmin && activeSosAlert && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '650px',
          backgroundColor: '#ef4444',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          boxShadow: '0 15px 40px rgba(239, 68, 68, 0.6)',
          zIndex: 999,
          animation: 'bounce 1s infinite'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={28} />
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.05rem', letterSpacing: '0.02em' }}>
                🚨 RESIDENT SOS PANIC ALERT — FLAT {activeSosAlert.flatNumber || activeSosAlert.payload?.flatNumber}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                {activeSosAlert.body || 'Resident triggered panic alarm! Dispatch guard immediately.'}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleAcknowledgeSos(activeSosAlert.id)}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#ffffff',
              color: '#ef4444',
              fontWeight: 900,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            Acknowledge & Respond
          </button>
        </div>
      )}

      {/* 3-Second Cancel Countdown Modal */}
      {showCountdownModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            maxWidth: '420px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '28px',
            padding: '32px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '18px',
            boxShadow: '0 25px 70px rgba(239, 68, 68, 0.5)',
            border: '2px solid rgba(239, 68, 68, 0.5)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              fontWeight: 900,
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.35)'
            }}>
              {countdown}
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                Sending Emergency SOS Alert
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                Alerting all security desk guards and admin for Flat {flatNumber || 'A-101'} in {countdown} seconds...
              </p>
            </div>

            <button
              onClick={handleCancel}
              style={{
                width: '100%',
                minHeight: '52px',
                borderRadius: '16px',
                border: '2px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#334155',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Cancel Alert
            </button>
          </div>
        </div>
      )}
    </>
  );
};

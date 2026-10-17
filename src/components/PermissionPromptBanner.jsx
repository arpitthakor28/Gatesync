import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../api/client';
import {
  Bell,
  X,
  Share,
  PlusSquare,
  Smartphone,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const PermissionPromptBanner = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [permissionState, setPermissionState] = useState('default');
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

    setIsIos(isIosDevice);
    setIsStandalone(standalone);

    if ('Notification' in window) {
      setPermissionState(Notification.permission);
      // If permission is default and user hasn't dismissed before
      const dismissed = localStorage.getItem('gatesync_notif_prompt_dismissed');
      if (Notification.permission === 'default' && !dismissed) {
        // Wait 3 seconds after page load before showing gentle pre-prompt
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support Web Push notifications.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      setShowPrompt(false);

      if (permission === 'granted') {
        // Register token via Service Worker
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          // In production with FCM, VAPID key is passed to getToken
          // Store device token with backend
          const dummyFcmToken = 'fcm_web_' + Math.random().toString(36).substring(2) + '_' + Date.now();
          await notificationsApi.registerFcmToken(dummyFcmToken, navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop PWA');
        }
      } else if (permission === 'denied') {
        alert('Notifications blocked. To receive gate intercom calls, please allow notifications in your browser Site Settings.');
      }
    } catch (e) {
      console.error('Notification permission error:', e);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('gatesync_notif_prompt_dismissed', 'true');
  };

  return (
    <>
      {/* Floating Permission Pre-Prompt Banner */}
      {showPrompt && permissionState === 'default' && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          maxWidth: '420px',
          backgroundColor: 'var(--bg-dark-modal, #ffffff)',
          border: '2px solid rgba(14, 165, 233, 0.4)',
          borderRadius: '20px',
          boxShadow: '0 20px 45px rgba(14, 165, 233, 0.28), 0 4px 14px rgba(0,0,0,0.06)',
          padding: '18px 20px',
          zIndex: 900,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(14, 165, 233, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary, #0284c7)'
              }}>
                <Bell size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main, #0c1e33)' }}>
                  Enable Gate Intercom Alerts
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                  Never miss an incoming visitor or package delivery
                </span>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #64748b)' }}
            >
              <X size={16} />
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.4 }}>
            Get instant sound alerts with Approve & Deny actions on your lock screen whenever someone checks in at the gate.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            {isIos && !isStandalone ? (
              <button
                onClick={() => setShowIosGuide(true)}
                className="btn btn-primary btn-sm"
                style={{ flex: 1, minHeight: '40px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 800 }}
              >
                <PlusSquare size={16} /> Install on iPhone First
              </button>
            ) : (
              <button
                onClick={handleRequestPermission}
                className="btn btn-primary btn-sm"
                style={{ flex: 1, minHeight: '40px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 800 }}
              >
                Enable Notifications
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="btn btn-secondary btn-sm"
              style={{ minHeight: '40px', borderRadius: '12px', fontSize: '0.82rem' }}
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari "Add to Home Screen" Instructions Modal */}
      {showIosGuide && (
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
            boxShadow: '0 25px 60px rgba(14, 165, 233, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={22} style={{ color: 'var(--color-primary, #0284c7)' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main, #0c1e33)' }}>
                  Install GateSync on iOS
                </h3>
              </div>
              <button onClick={() => setShowIosGuide(false)} className="btn btn-secondary btn-sm" style={{ minHeight: '38px', minWidth: '38px', borderRadius: '50%', padding: 0 }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.45 }}>
              Apple iOS requires Web Apps to be added to the Home Screen to receive Web Push sound alerts when closed:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '14px', backgroundColor: 'var(--bg-dark-input, rgba(0,0,0,0.03))' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(14, 165, 233, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary, #0284c7)', fontWeight: 800 }}>
                  1
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main, #0c1e33)' }}>
                  Tap the <strong>Share</strong> button <Share size={15} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 4px' }} /> in the Safari toolbar.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '14px', backgroundColor: 'var(--bg-dark-input, rgba(0,0,0,0.03))' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(14, 165, 233, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary, #0284c7)', fontWeight: 800 }}>
                  2
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main, #0c1e33)' }}>
                  Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare size={15} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 4px' }} />.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '14px', backgroundColor: 'var(--bg-dark-input, rgba(0,0,0,0.03))' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(14, 165, 233, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary, #0284c7)', fontWeight: 800 }}>
                  3
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main, #0c1e33)' }}>
                  Open <strong>GateSync</strong> from your home screen and allow notifications!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '44px', borderRadius: '14px', marginTop: '6px' }}
            >
              Got It, Thanks!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

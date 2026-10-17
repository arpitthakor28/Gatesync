import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { stompService } from '../api/stompClient';
import { notificationsApi, visitorApi } from '../api/client';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated, role, societyId, flatNumber } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [incomingVisitor, setIncomingVisitor] = useState(null);
  const [preferences, setPreferences] = useState({
    soundEnabled: true,
    vibrationEnabled: true,
    quietHoursEnabled: false
  });
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [guardWakeLockActive, setGuardWakeLockActive] = useState(false);
  const [stompConnected, setStompConnected] = useState(false);

  const audioCtxRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const vibrateIntervalRef = useRef(null);
  const wakeLockRef = useRef(null);

  // 1. Audio Unlock on first user interaction anywhere in document
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext && !audioCtxRef.current) {
          audioCtxRef.current = new AudioContext();
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        setIsAudioUnlocked(true);
      } catch (e) {
        console.warn('Audio unlock error:', e);
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // 2. Synthesized Sound Generators (Dual-tone Phone Ring & Siren)
  const playRingPulse = useCallback(() => {
    if (!preferences.soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      // Dual-tone frequencies (440Hz + 480Hz Indian / US Ringback standard)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.setValueAtTime(0.3, now + 1.2);
      gain.gain.linearRampToValueAtTime(0, now + 1.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.3);
      osc2.stop(now + 1.3);
    } catch (e) {
      console.warn('Audio ring pulse failed:', e);
    }
  }, [preferences.soundEnabled]);

  const startAlertRinging = useCallback(() => {
    playRingPulse();
    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    ringIntervalRef.current = setInterval(playRingPulse, 2800);

    // Looping vibration pattern
    if (preferences.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([300, 150, 300, 150, 450]);
      if (vibrateIntervalRef.current) clearInterval(vibrateIntervalRef.current);
      vibrateIntervalRef.current = setInterval(() => {
        navigator.vibrate([300, 150, 300, 150, 450]);
      }, 2800);
    }
  }, [playRingPulse, preferences.vibrationEnabled]);

  const stopAlertRinging = useCallback(() => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (vibrateIntervalRef.current) {
      clearInterval(vibrateIntervalRef.current);
      vibrateIntervalRef.current = null;
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }, []);

  // 3. Screen Wake Lock API for Gate Security Desks (Guards)
  useEffect(() => {
    const isGuard = role === 'GUARD' || role === 'staff';
    let isMounted = true;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isGuard && document.visibilityState === 'visible') {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          if (isMounted) setGuardWakeLockActive(true);
          wakeLockRef.current.addEventListener('release', () => {
            if (isMounted) setGuardWakeLockActive(false);
          });
          console.log('[WakeLock] Screen Wake Lock acquired for Guard Gate Desk');
        } catch (err) {
          console.warn('[WakeLock] Could not acquire screen wake lock:', err);
        }
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [role]);

  // 4. Update Badging API
  const updateBadge = useCallback((count) => {
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count).catch(() => {});
      } else if ('clearAppBadge' in navigator) {
        navigator.clearAppBadge().catch(() => {});
      }
    }
  }, []);

  // 5. Resync pending events on initial load or STOMP reconnect
  const resyncPendingEvents = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      // A. Fetch pending notifications for user
      const pendingNotifs = await notificationsApi.getPending();
      if (Array.isArray(pendingNotifs) && pendingNotifs.length > 0) {
        setNotifications(prev => {
          const ids = new Set(prev.map(n => n.id));
          const newItems = pendingNotifs.filter(p => !ids.has(p.id));
          return [...newItems, ...prev];
        });
        setUnreadCount(pendingNotifs.length);
        updateBadge(pendingNotifs.length);

        // Check if there is a pending VISITOR_REQUEST among them
        const visitorReq = pendingNotifs.find(n => n.type === 'VISITOR_REQUEST' && n.status !== 'ACTED');
        if (visitorReq && (role === 'RESIDENT' || role === 'member')) {
          setIncomingVisitor({
            id: visitorReq.payload?.requestId || visitorReq.id,
            notificationId: visitorReq.id,
            visitorName: visitorReq.payload?.visitorName || 'Visitor',
            flatNumber: visitorReq.payload?.flatNumber || flatNumber,
            purpose: visitorReq.payload?.purpose || 'Visit',
            vehicleNumber: visitorReq.payload?.vehicleNumber,
            photoUrl: visitorReq.payload?.visitorPhotoUrl,
            phone: visitorReq.payload?.visitorPhone,
            createdAt: visitorReq.createdAt
          });
          startAlertRinging();
        }
      }

      // B. Fetch pending visitor requests directly from visitor API for resident
      if (role === 'RESIDENT' || role === 'member') {
        const pendingVis = await visitorApi.getPendingForResident();
        if (Array.isArray(pendingVis) && pendingVis.length > 0 && !incomingVisitor) {
          const first = pendingVis[0];
          setIncomingVisitor({
            id: first.id,
            visitorName: first.visitorName,
            flatNumber: first.flatNumber,
            purpose: first.purpose,
            vehicleNumber: first.vehicleNumber,
            photoUrl: first.photoUrl,
            phone: first.visitorPhone,
            createdAt: first.createdAt
          });
          startAlertRinging();
        }
      }
    } catch (err) {
      console.warn('Pending resync error:', err);
    }
  }, [isAuthenticated, role, flatNumber, incomingVisitor, startAlertRinging, updateBadge]);

  // 6. Connect STOMP and Setup Subscriptions
  useEffect(() => {
    if (!isAuthenticated || !user) {
      stompService.disconnect();
      setStompConnected(false);
      return;
    }

    stompService.connect(user);
    setStompConnected(true);

    const unsubReconnect = stompService.onReconnect(() => {
      console.log('[NotificationContext] STOMP reconnected. Resyncing pending events...');
      resyncPendingEvents();
    });

    const currentSocietyId = societyId || 'SOC-101';
    const currentFlat = flatNumber || 'A-101';

    // Channel 1: Personal User Queue
    const unsubUserQueue = stompService.subscribe('user-queue', '/user/queue/notifications', (notif) => {
      handleIncomingNotification(notif);
    });

    // Channel 2: Flat Queue
    const unsubFlat = stompService.subscribe('flat-topic', `/topic/society/${currentSocietyId}/flat/${currentFlat}`, (notif) => {
      handleIncomingNotification(notif);
    });

    // Channel 3: Guards Broadcast (if guard or admin)
    let unsubGuards = () => {};
    if (role === 'GUARD' || role === 'ADMIN' || role === 'staff' || role === 'admin') {
      unsubGuards = stompService.subscribe('guards-topic', `/topic/society/${currentSocietyId}/guards`, (notif) => {
        handleIncomingNotification(notif);
      });
    }

    // Initial resync
    resyncPendingEvents();

    return () => {
      unsubReconnect();
      unsubUserQueue();
      unsubFlat();
      unsubGuards();
      stompService.disconnect();
      setStompConnected(false);
    };
  }, [isAuthenticated, user, societyId, flatNumber, role, resyncPendingEvents]);

  // 7. Process Incoming Notification and Send Immediate STOMP ACK
  const handleIncomingNotification = (notif) => {
    if (!notif) return;

    // Send immediate ACK to satisfy backend 2-second dedupe window
    if (notif.id) {
      stompService.sendAck(notif.id, 'DELIVERED');
      notificationsApi.ack(notif.id, 'DELIVERED').catch(() => {});
    }

    // Add to notifications feed
    setNotifications(prev => [notif, ...prev.filter(n => n.id !== notif.id)]);
    setUnreadCount(prev => {
      const next = prev + 1;
      updateBadge(next);
      return next;
    });

    // Handle Incoming Visitor Request for Resident
    if (notif.type === 'VISITOR_REQUEST') {
      setIncomingVisitor({
        id: notif.payload?.requestId || notif.id,
        notificationId: notif.id,
        visitorName: notif.payload?.visitorName || 'Guest / Visitor',
        flatNumber: notif.payload?.flatNumber || flatNumber,
        purpose: notif.payload?.purpose || 'Gate Entry',
        vehicleNumber: notif.payload?.vehicleNumber,
        photoUrl: notif.payload?.visitorPhotoUrl,
        phone: notif.payload?.visitorPhone,
        createdAt: notif.createdAt || new Date().toISOString()
      });
      startAlertRinging();
    }

    // Handle Visitor Decision resolved (close modal if matches)
    if (notif.type === 'VISITOR_APPROVED' || notif.type === 'VISITOR_REJECTED' || notif.type === 'VISITOR_NO_RESPONSE') {
      const resolvedReqId = notif.payload?.requestId;
      if (incomingVisitor && String(incomingVisitor.id) === String(resolvedReqId)) {
        closeIncomingModal();
      }
    }
  };

  const closeIncomingModal = () => {
    stopAlertRinging();
    setIncomingVisitor(null);
  };

  const decideVisitor = async (requestId, approved, denialReason = null) => {
    stopAlertRinging();
    setIncomingVisitor(null);
    try {
      const res = await visitorApi.decide(requestId, approved, denialReason);
      return res;
    } catch (err) {
      console.error('Failed to decide visitor request:', err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, status: 'SEEN' })));
    setUnreadCount(0);
    updateBadge(0);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      incomingVisitor,
      closeIncomingModal,
      decideVisitor,
      preferences,
      setPreferences,
      markAllAsRead,
      stompConnected,
      guardWakeLockActive,
      isAudioUnlocked,
      startAlertRinging,
      stopAlertRinging
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

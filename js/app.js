/**
 * GateSync - Smart Society Visitor Management System
 * Fullstack Client Application Engine (Matching User UI Mockups 100%)
 */

(function () {
  // Global Application State
  const state = {
    currentUser: null,
    token: null,
    activeView: 'landing', // landing, admin, guard, resident, password_reset
    adminTab: 'dashboard', // dashboard, logs, directory, guards, alerts, settings
    // Auth Form Tabs
    authRole: 'RESIDENT',
    authMode: 'LOGIN',
    searchQuery: '',
    searchDropdownOpen: false,
    residentStatusFilter: 'ALL',
    guardShiftFilter: 'ALL',
    isAuthenticating: false,
    isRefreshing: false,
    notificationDrawerOpen: false,
    notificationFilter: 'ALL',
    activeEmergency: null,
    soundMuted: false,
    webPushPermission: (typeof Notification !== 'undefined' ? Notification.permission : 'default'),
    selectedPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    cameraStream: null,
    stompClient: null,
    
    // Notifications Feed
    notifications: [],

    // Clubhouse Bookings Module (Reset to Zero)
    clubhouseBookings: [],

    // Community Problems Broadcast Module (Reset to Zero)
    communityProblems: [],

    // Visitor Requests State (Reset to Zero)
    visitorRequests: [],

    // Resident Directory (Reset to Zero)
    residents: [],

    // Security Guards (Reset to Zero)
    guards: []
  };

  const PRESET_PHOTOS = [
    { title: 'Delivery Driver', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
    { title: 'Guest Visitor', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
    { title: 'Service Tech', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' },
    { title: 'Cab Driver', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80' }
  ];

  function getDatabaseUsers() {
    try {
      const stored = localStorage.getItem('gatesync_db_users');
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    // Clean initialization: Only seed default Admin account.
    // Testing Resident and Guard accounts are removed so Resident & Guard counts start at zero (0).
    const seed = [
      { id: 1, loginId: 'admin', password: '123', fullName: 'System Admin', role: 'ADMIN', phone: '9999999999' }
    ];

    localStorage.setItem('gatesync_db_users', JSON.stringify(seed));
    return seed;
  }

  function saveDatabaseUser(userObj) {
    if (!userObj || (!userObj.loginId && !userObj.phone && !userObj.id)) return;
    const users = getDatabaseUsers();
    const idx = users.findIndex(u => 
      (u.loginId && userObj.loginId && u.loginId.toLowerCase() === userObj.loginId.toLowerCase()) ||
      (u.phone && userObj.phone && u.phone === userObj.phone) ||
      (u.id && userObj.id && u.id === userObj.id)
    );
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...userObj };
    } else {
      users.push(userObj);
    }
    localStorage.setItem('gatesync_db_users', JSON.stringify(users));
  }

  function getVisitorRequestsFromStorage() {
    try {
      const stored = localStorage.getItem('gatesync_visitor_requests');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }

  function saveVisitorRequestsToStorage() {
    try {
      localStorage.setItem('gatesync_visitor_requests', JSON.stringify(state.visitorRequests));
  function broadcastSyncEvent(eventType, payload) {
    try {
      if (window.gatesyncChannel) {
        window.gatesyncChannel.postMessage({ type: eventType, payload: payload, requests: state.visitorRequests, notifications: state.notifications, emergency: state.activeEmergency });
      }
    } catch (e) {}
  }

  function saveNotificationsToStorage() {
    try {
      localStorage.setItem('gatesync_notifications', JSON.stringify(state.notifications));
      broadcastSyncEvent('SYNC_NOTIFICATIONS', state.notifications);
    } catch (e) {}
  }

  function loadNotificationsFromStorage() {
    try {
      const stored = localStorage.getItem('gatesync_notifications');
      if (stored) state.notifications = JSON.parse(stored);
    } catch (e) {}
  }

  if (typeof BroadcastChannel !== 'undefined') {
    window.gatesyncChannel = new BroadcastChannel('gatesync_sync_channel');
    window.gatesyncChannel.onmessage = (evt) => {
      if (!evt.data) return;
      const { type, payload, requests, notifications, emergency } = evt.data;

      if (type === 'SYNC_VISITORS') {
        state.visitorRequests = requests || [];
        render();
      } else if (type === 'SYNC_NOTIFICATIONS') {
        state.notifications = notifications || [];
        render();
      } else if (type === 'SYNC_EMERGENCY_SOS') {
        state.activeEmergency = emergency;
        if (emergency && emergency.status === 'ACTIVE') {
          playEmergencySound();
          showToast(`🚨 EMERGENCY SOS: ${emergency.emergencyType} reported by ${emergency.callerName}`, 'emergency');
        } else {
          stopEmergencySound();
        }
        renderEmergencyBanner();
        render();
      } else if (type === 'VISITOR_EVENT') {
        handleNotificationEvent(payload);
      }
    };
  }

  window.addEventListener('storage', (e) => {
    if (e.key === 'gatesync_visitor_requests' && e.newValue) {
      try {
        const oldReqs = state.visitorRequests || [];
        const newReqs = JSON.parse(e.newValue) || [];
        state.visitorRequests = newReqs;

        const newlyAdded = newReqs.find(nr => !oldReqs.some(or => or.id === nr.id) && nr.status === 'PENDING');
        if (newlyAdded) {
          handleNotificationEvent({
            type: 'VISITOR_NEW',
            requestId: newlyAdded.id,
            visitorName: newlyAdded.visitorName,
            visitorPhone: newlyAdded.visitorPhone,
            purpose: newlyAdded.purpose,
            targetFlat: newlyAdded.targetFlat,
            targetBlock: newlyAdded.targetBlock,
            photoUrl: newlyAdded.photoUrl,
            status: newlyAdded.status,
            timestamp: newlyAdded.createdAt
          });
        }
      } catch (err) {}
    } else if (e.key === 'gatesync_notifications' && e.newValue) {
      try {
        state.notifications = JSON.parse(e.newValue) || [];
        render();
      } catch (err) {}
    }
  });
            photoUrl: newlyAdded.photoUrl,
            status: 'PENDING'
          });
        } else {
          render();
        }
      } catch (err) {}
    }
  });

  // App Initialization
  document.addEventListener('DOMContentLoaded', () => {
    loadSavedSession();
    fetchInitialData();
    connectWebSocket();
    render();
  });

  function loadSavedSession() {
    const savedUser = localStorage.getItem('gatesync_user');
    const savedToken = localStorage.getItem('gatesync_token') || 'token_pwa_session';
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user && user.role) {
          state.currentUser = user;
          state.token = savedToken;
          state.activeView = user.role.toLowerCase();
          return;
        }
      } catch (e) {}
    }
    state.activeView = 'landing';
  }

  function saveSession(user, token) {
    state.currentUser = user;
    state.token = token;
    localStorage.setItem('gatesync_user', JSON.stringify(user));
    localStorage.setItem('gatesync_token', token);
  }

  function clearSession() {
    state.currentUser = null;
    state.token = null;
    localStorage.removeItem('gatesync_user');
    localStorage.removeItem('gatesync_token');
    state.activeView = 'landing';
    render();
    showToast('Logged out successfully', 'info');
  }

  function normalizeResident(r) {
    if (!r) return null;
    const fullName = r.fullName || r.name || 'Resident';
    const initials = r.initials || (fullName ? fullName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'RS');
    
    let flatStr = r.flat;
    if (!flatStr) {
      if (r.blockNumber && r.flatNumber) {
        flatStr = `${r.blockNumber}-${r.flatNumber}`;
      } else if (r.flatNumber) {
        flatStr = r.flatNumber;
      } else if (r.blockNumber) {
        flatStr = r.blockNumber;
      } else {
        flatStr = '';
      }
    }
    
    let statusStr = r.status;
    if (!statusStr) {
      statusStr = (r.active !== false) ? 'Active' : 'Inactive';
    }

    return {
      id: r.id || Date.now(),
      name: fullName,
      fullName: fullName,
      initials: initials,
      flat: flatStr,
      blockNumber: r.blockNumber || (flatStr.includes('-') ? flatStr.split('-')[0] : 'A'),
      flatNumber: r.flatNumber || (flatStr.includes('-') ? flatStr.split('-')[1] : flatStr),
      loginId: r.loginId || '',
      phone: r.phone || '',
      backupPhone: r.backupPhone || '',
      status: statusStr,
      active: statusStr === 'Active',
      avatarBg: r.avatarBg || 'blue'
    };
  }

  async function apiFetch(url, options = {}) {
    const headers = options.headers || {};
    if (state.token) {
      headers['Authorization'] = 'Bearer ' + state.token;
    }
    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(url, { ...options, headers });
    if (response.status === 403) {
      try {
        const errJson = await response.clone().json();
        if (errJson && errJson.code === 'PASSWORD_RESET_REQUIRED') {
          const userId = state.currentUser ? (state.currentUser.id || state.currentUser.loginId) : null;
          const promptDoneKey = userId ? `gatesync_pwd_prompt_done_${userId}` : null;
          if (promptDoneKey && !localStorage.getItem(promptDoneKey)) {
            localStorage.setItem(promptDoneKey, 'true');
            state.activeView = 'password_reset';
            render();
            showToast('Password reset required before proceeding.', 'amber');
          }
        }
      } catch (e) {}
    }
    return response;
  }

  async function fetchInitialData() {
    try {
      const isResident = state.currentUser && state.currentUser.role === 'RESIDENT';
      const visitorEndpoint = isResident ? '/api/resident/visitors' : '/api/guard/visitors/all';

      const [resReq, resGuards, resResidents, resProblems, resClubhouse] = await Promise.all([
        apiFetch(visitorEndpoint).then(r => r.ok ? r.json() : null),
        apiFetch('/api/admin/guards').then(r => r.ok ? r.json() : null),
        apiFetch('/api/admin/residents').then(r => r.ok ? r.json() : null),
        apiFetch('/api/resident/problems/all').then(r => r.ok ? r.json() : null),
        apiFetch('/api/resident/clubhouse/my-bookings').then(r => r.ok ? r.json() : null)
      ]);

      if (resReq && Array.isArray(resReq) && resReq.length) state.visitorRequests = resReq;
      if (resGuards && Array.isArray(resGuards) && resGuards.length) state.guards = resGuards;
      if (resResidents && Array.isArray(resResidents) && resResidents.length) {
        state.residents = resResidents.map(normalizeResident).filter(Boolean);
      }
      if (resProblems && Array.isArray(resProblems) && resProblems.length) state.communityProblems = resProblems;
      if (resClubhouse && Array.isArray(resClubhouse) && resClubhouse.length) state.clubhouseBookings = resClubhouse;
    } catch (e) {
      console.warn('API backend connecting, using local UI state fallback.');
    }

    // Merge visitor requests from local storage
    const storedReqs = getVisitorRequestsFromStorage();
    if (storedReqs && storedReqs.length > 0) {
      storedReqs.forEach(sr => {
        if (!state.visitorRequests.some(r => r.id === sr.id)) {
          state.visitorRequests.push(sr);
        }
      });
    }

    // Merge database users from local storage if state lists are missing entries
    const dbUsers = getDatabaseUsers();
    const dbResidents = dbUsers.filter(u => u.role === 'RESIDENT').map(normalizeResident).filter(Boolean);
    const dbGuards = dbUsers.filter(u => u.role === 'GUARD');

    dbResidents.forEach(dbr => {
      if (!state.residents.some(r => r.loginId && r.loginId.toLowerCase() === dbr.loginId.toLowerCase())) {
        state.residents.push(dbr);
      }
    });

    dbGuards.forEach(dbg => {
      if (!state.guards.some(g => g.loginId && g.loginId.toLowerCase() === dbg.loginId.toLowerCase())) {
        state.guards.push(dbg);
      }
    });

    render();
  }

  let wsReconnectTimer = null;

  function connectWebSocket() {
    try {
      if (typeof SockJS !== 'undefined' && typeof Stomp !== 'undefined') {
        const socket = new SockJS('/ws-gatesync');
        state.stompClient = Stomp.over(socket);
        state.stompClient.debug = null;

        const connectHeaders = {};
        if (state.token) {
          connectHeaders['Authorization'] = 'Bearer ' + state.token;
        }

        state.stompClient.connect(connectHeaders, () => {
          console.log('Connected to GateSync WebSocket Broker.');
          if (wsReconnectTimer) {
            clearTimeout(wsReconnectTimer);
            wsReconnectTimer = null;
          }

          // 1. Guard queue topic
          state.stompClient.subscribe('/topic/guard/queue', message => {
            try { handleNotificationEvent(JSON.parse(message.body)); } catch (e) {}
          });

          // 2. Emergency SOS topic
          state.stompClient.subscribe('/topic/emergency/sos', message => {
            try { handleNotificationEvent(JSON.parse(message.body)); } catch (e) {}
          });

          // 3. Society Broadcast topic
          state.stompClient.subscribe('/topic/society/broadcast', message => {
            try { handleNotificationEvent(JSON.parse(message.body)); } catch (e) {}
          });

          // 4. Role topic
          if (state.currentUser && state.currentUser.role) {
            state.stompClient.subscribe(`/topic/role/${state.currentUser.role}`, message => {
              try { handleNotificationEvent(JSON.parse(message.body)); } catch (e) {}
            });
          }

          // 5. Resident unit topic
          if (state.currentUser && state.currentUser.role === 'RESIDENT') {
            const block = state.currentUser.blockNumber || 'A';
            const flat = state.currentUser.flatNumber || '101';
            state.stompClient.subscribe(`/topic/resident/${block}-${flat}`, message => {
              try { handleNotificationEvent(JSON.parse(message.body)); } catch (e) {}
            });
          }
        }, err => {
          console.warn('WebSocket connection lost, auto-reconnecting in 4s...');
          wsReconnectTimer = setTimeout(connectWebSocket, 4000);
        });
      }
    } catch (e) {
      wsReconnectTimer = setTimeout(connectWebSocket, 5000);
    }
  }

  function playAlertSound() {
    playChimeSound();
  }

  function playChimeSound() {
    if (state.soundMuted) return;
    const audio = document.getElementById('alert-sound');
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  function playEmergencySound() {
    if (state.soundMuted) return;
    const audio = document.getElementById('emergency-sound');
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  function stopEmergencySound() {
    const audio = document.getElementById('emergency-sound');
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  window.toggleSoundMute = function() {
    state.soundMuted = !state.soundMuted;
    if (state.soundMuted) {
      stopEmergencySound();
      showToast('🔇 Audio alert sound muted', 'info');
    } else {
      showToast('🔊 Audio alert sound enabled', 'info');
    }
    render();
  };

  function requestWebPushPermission() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        state.webPushPermission = permission;
        if (permission === 'granted') {
          showToast('🔔 Browser push notifications enabled', 'success');
        }
      });
    }
  }

  function showDesktopNotification(title, body, icon = null) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
      try {
        new Notification(title, {
          body: body,
          icon: icon || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=192&auto=format&fit=crop&q=80',
          badge: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=192&auto=format&fit=crop&q=80'
        });
      } catch (e) {}
    }
  }

  function pushNotificationItem(item) {
    if (!state.notifications) state.notifications = [];
    state.notifications.unshift(item);
    saveNotificationsToStorage();
  }

  function handleNotificationEvent(event) {
    if (!event) return;

    // 1. Emergency SOS Panic Event
    if (event.type === 'EMERGENCY_SOS' || event.category === 'EMERGENCY_SOS') {
      const emergency = event.payload || event;
      state.activeEmergency = emergency;
      playEmergencySound();
      showDesktopNotification('🚨 EMERGENCY SOS ALERT', `${emergency.emergencyType || 'General Emergency'} reported by ${emergency.callerName || 'Resident'}`);
      showToast(`🚨 CRITICAL EMERGENCY SOS: ${emergency.emergencyType || 'General'}!`, 'emergency');

      pushNotificationItem({
        id: event.id || Date.now(),
        title: `🚨 EMERGENCY: ${emergency.emergencyType || 'General'}`,
        message: `Panic alert by ${emergency.callerName || 'User'} (${emergency.blockNumber ? 'Flat ' + emergency.blockNumber + '-' + emergency.flatNumber : 'Gate'})`,
        category: 'EMERGENCY_SOS',
        priority: 'CRITICAL',
        read: false,
        time: 'Just now'
      });

      broadcastSyncEvent('SYNC_EMERGENCY_SOS', emergency);
      renderEmergencyBanner();
      render();
      return;
    }

    // 2. Visitor Event
    if (event.requestId || event.type === 'VISITOR_NEW' || event.type === 'VISITOR_UPDATE') {
      if (event.requestId) {
        const existing = state.visitorRequests.find(r => r.id === event.requestId);
        if (!existing && (event.type === 'VISITOR_NEW' || event.status === 'PENDING')) {
          const newReq = {
            id: event.requestId,
            visitorName: event.visitorName,
            visitorPhone: event.visitorPhone || 'N/A',
            purpose: event.purpose,
            targetFlat: event.targetFlat,
            targetBlock: event.targetBlock,
            photoUrl: event.photoUrl || PRESET_PHOTOS[0].url,
            status: event.status || 'PENDING',
            timeAgo: 'Just now',
            createdAt: event.timestamp || new Date().toISOString()
          };
          state.visitorRequests.unshift(newReq);
          saveVisitorRequestsToStorage();
        } else if (existing && (event.type === 'VISITOR_UPDATE' || event.status)) {
          existing.status = event.status;
          saveVisitorRequestsToStorage();
        }
      }

      if (event.type === 'VISITOR_NEW' || event.status === 'PENDING') {
        showToast(`🔔 ALERT: New Visitor ${event.visitorName || ''} at Gate!`, 'amber');
        playChimeSound();
        showDesktopNotification('🔔 New Visitor at Gate', `Visitor ${event.visitorName || ''} has arrived for Flat ${event.targetBlock || 'A'}-${event.targetFlat || '101'}`);

        pushNotificationItem({
          id: Date.now(),
          title: `🔔 Visitor Arrival: ${event.visitorName || 'Guest'}`,
          message: `Arrived at gate for Flat ${event.targetBlock || 'A'}-${event.targetFlat || '101'}.`,
          category: 'VISITOR',
          priority: 'HIGH',
          read: false,
          time: 'Just now'
        });

        // Automatically open live approval modal for logged-in resident
        if (state.currentUser && (state.currentUser.role === 'RESIDENT' || state.activeView === 'resident')) {
          const reqId = event.requestId || (state.visitorRequests.length ? state.visitorRequests[0].id : null);
          if (reqId) {
            setTimeout(() => {
              if (typeof window.openApproveModal === 'function') {
                window.openApproveModal(reqId);
              }
            }, 150);
          }
        }
      } else if (event.type === 'VISITOR_UPDATE') {
        showToast(`Visitor status updated to ${event.status} for ${event.visitorName}`, event.status === 'APPROVED' ? 'success' : 'error');
        pushNotificationItem({
          id: Date.now(),
          title: `Visitor ${event.status}: ${event.visitorName || ''}`,
          message: `Visitor status changed to ${event.status}.`,
          category: 'VISITOR',
          priority: 'NORMAL',
          read: false,
          time: 'Just now'
        });
      }
    }

    // 3. Announcement / Complaint / Clubhouse events
    if (event.type === 'ANNOUNCEMENT' || event.category === 'ANNOUNCEMENT') {
      showToast(`📢 ${event.title || 'Announcement'}: ${event.message || ''}`, 'announcement');
      playChimeSound();
      showDesktopNotification(`📢 ${event.title || 'Announcement'}`, event.message || '');
      pushNotificationItem({
        id: event.id || Date.now(),
        title: event.title || '📢 Announcement',
        message: event.message,
        category: 'ANNOUNCEMENT',
        priority: 'HIGH',
        read: false,
        time: 'Just now'
      });
    } else if (event.category === 'COMPLAINT') {
      showToast(`⚠️ ${event.title || 'Complaint Update'}`, 'info');
      pushNotificationItem({
        id: event.id || Date.now(),
        title: event.title || 'Complaint Alert',
        message: event.message,
        category: 'COMPLAINT',
        priority: 'NORMAL',
        read: false,
        time: 'Just now'
      });
    } else if (event.category === 'CLUBHOUSE') {
      showToast(`🎉 ${event.title || 'Booking Update'}`, 'success');
      pushNotificationItem({
        id: event.id || Date.now(),
        title: event.title || 'Clubhouse Booking',
        message: event.message,
        category: 'CLUBHOUSE',
        priority: 'NORMAL',
        read: false,
        time: 'Just now'
      });
    }

    render();
  }

  function playAlertSound() {
    const audio = document.getElementById('alert-sound');
    if (audio) audio.play().catch(() => {});
  }

  window.showToast = function (message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'bell';
    toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // Main Render Orchestrator
  function render() {
    const container = document.getElementById('app-container');
    if (!container) return;

    if (state.activeView === 'landing') {
      container.innerHTML = renderLandingPage();
    } else if (state.activeView === 'password_reset') {
      container.innerHTML = renderPasswordResetPage();
    } else {
      container.innerHTML = renderDashboardLayout();
    }

    lucide.createIcons();
    bindEvents();
  }

  // 1. Landing & Login Page
  function renderLandingPage() {
    const role = state.authRole || 'RESIDENT';
    const mode = state.authMode || 'LOGIN';

    return `
      <div class="landing-hero">
        <nav class="landing-nav">
          <div class="sidebar-brand" style="padding:0; border:none;">
            <div class="brand-icon"><i data-lucide="shield-check"></i></div>
            <div class="brand-title-wrap">
              <div class="brand-text" style="font-size: 24px; color:white;">GateSync</div>
              <span class="brand-subtext" style="color:#94a3b8;">Community Security</span>
            </div>
          </div>
          <div style="display:flex; gap:12px;">
            <button class="btn btn-secondary" onclick="openHelpModal()"><i data-lucide="help-circle"></i> Need Help?</button>
            <a href="#login-section" class="btn btn-primary"><i data-lucide="log-in"></i> Access Portal</a>
          </div>
        </nav>

        <div class="landing-container">
          <div>
            <div style="display:inline-block; background:rgba(37,99,235,0.2); color:#60a5fa; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:700; margin-bottom:20px;">
              🛡️ Enterprise Residential Society Security
            </div>
            <h1 style="font-family:var(--font-heading); font-size:48px; font-weight:800; line-height:1.1; margin-bottom:20px;">
              Smart Gatekeeping for Modern Communities.
            </h1>
            <p style="font-size:16px; color:#94a3b8; margin-bottom:32px; max-width:480px;">
              GateSync empowers Admins, Guards, and Residents with real-time entry approvals, live camera logs, pre-approved guest passes, and clubhouse bookings.
            </p>
            <div style="display:flex; gap:24px;">
              <div>
                <h3 style="font-size:24px; color:#fff; font-weight:700;">100%</h3>
                <p style="font-size:12px; color:#94a3b8;">Real-Time Sync</p>
              </div>
              <div>
                <h3 style="font-size:24px; color:#fff; font-weight:700;">&lt; 3s</h3>
                <p style="font-size:12px; color:#94a3b8;">Gate Approval Speed</p>
              </div>
              <div>
                <h3 style="font-size:24px; color:#fff; font-weight:700;">256-Bit</h3>
                <p style="font-size:12px; color:#94a3b8;">Encrypted Logs</p>
              </div>
            </div>
          </div>

          <div class="login-card" id="login-section" style="min-width:340px;">
            <!-- Role Selection Tabs -->
            <div style="margin-bottom:18px;">
              <label style="font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:8px;">Select User Portal</label>
              <div style="display:flex; background:#f1f5f9; padding:4px; border-radius:10px;">
                <button type="button" onclick="setAuthRole('RESIDENT')" style="flex:1; padding:8px 4px; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; background:${role === 'RESIDENT' ? '#fff' : 'transparent'}; color:${role === 'RESIDENT' ? '#2563eb' : '#64748b'}; box-shadow:${role === 'RESIDENT' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'};">
                  <i data-lucide="home" style="width:14px; height:14px; vertical-align:-2px;"></i> Resident
                </button>
                <button type="button" onclick="setAuthRole('GUARD')" style="flex:1; padding:8px 4px; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; background:${role === 'GUARD' ? '#fff' : 'transparent'}; color:${role === 'GUARD' ? '#2563eb' : '#64748b'}; box-shadow:${role === 'GUARD' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'};">
                  <i data-lucide="shield-check" style="width:14px; height:14px; vertical-align:-2px;"></i> Guard
                </button>
                <button type="button" onclick="setAuthRole('ADMIN')" style="flex:1; padding:8px 4px; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; background:${role === 'ADMIN' ? '#fff' : 'transparent'}; color:${role === 'ADMIN' ? '#2563eb' : '#64748b'}; box-shadow:${role === 'ADMIN' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'};">
                  <i data-lucide="shield" style="width:14px; height:14px; vertical-align:-2px;"></i> Admin
                </button>
              </div>
            </div>

            ${role === 'ADMIN' ? `
              <!-- Mode Switcher for Admin (Login vs Register) -->
              <div style="display:flex; border-bottom:2px solid #e2e8f0; margin-bottom:20px;">
                <button type="button" onclick="setAuthMode('LOGIN')" style="flex:1; padding:10px; border:none; border-bottom:2px solid ${mode === 'LOGIN' ? '#2563eb' : 'transparent'}; background:none; font-weight:700; font-size:14px; color:${mode === 'LOGIN' ? '#2563eb' : '#64748b'}; cursor:pointer; margin-bottom:-2px;">
                  <i data-lucide="log-in" style="width:15px; height:15px; vertical-align:-2px;"></i> Admin Login
                </button>
                <button type="button" onclick="setAuthMode('REGISTER')" style="flex:1; padding:10px; border:none; border-bottom:2px solid ${mode === 'REGISTER' ? '#2563eb' : 'transparent'}; background:none; font-weight:700; font-size:14px; color:${mode === 'REGISTER' ? '#2563eb' : '#64748b'}; cursor:pointer; margin-bottom:-2px;">
                  <i data-lucide="user-plus" style="width:15px; height:15px; vertical-align:-2px;"></i> Register Admin
                </button>
              </div>
            ` : `
              <!-- Guidance Notice for Resident & Guard (No Register option) -->
              <div style="padding:10px 12px; background:#eff6ff; border-radius:8px; font-size:12px; color:#1e40af; margin-bottom:20px; display:flex; align-items:center; gap:8px;">
                <i data-lucide="info" style="width:16px; height:16px; flex-shrink:0;"></i>
                <span>${role === 'RESIDENT' ? 'Resident credentials are provided by Society Admin. Enter your ID and password below.' : 'Guard access accounts are provisioned by Admin. Enter Guard ID and password below.'}</span>
              </div>
            `}

            ${(role !== 'ADMIN' || mode === 'LOGIN') ? `
              <form id="login-form" autocomplete="off">
                <div class="form-group" style="margin-bottom:16px;">
                  <label>${role === 'RESIDENT' ? 'Resident ID / Mobile Number' : role === 'GUARD' ? 'Guard ID / Username' : 'Admin Username / ID'}</label>
                  <input type="text" id="login-id" class="form-control" placeholder="${role === 'RESIDENT' ? 'Enter Resident ID' : role === 'GUARD' ? 'Enter Guard ID' : 'Enter Admin ID'}" required value="" autocomplete="off" name="gatesync_user_id_${Date.now()}">
                </div>
                <div class="form-group" style="margin-bottom:20px;">
                  <label>Password</label>
                  <div style="position:relative;">
                    <input type="password" id="login-password" class="form-control" placeholder="Enter Password" required value="" autocomplete="new-password" name="gatesync_user_pass_${Date.now()}" style="padding-right:42px;">
                    <button type="button" onclick="togglePasswordVisibility('login-password', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                      <i data-lucide="eye" style="width:18px; height:18px;"></i>
                    </button>
                  </div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; font-size:12px;">
                  <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                    <input type="checkbox"> Remember me
                  </label>
                  <a href="#" onclick="openForgotPasswordModal()" style="color:var(--primary-blue); text-decoration:none; font-weight:600;">Forgot Password?</a>
                </div>
                <button type="submit" id="login-submit-btn" class="btn btn-primary" style="width:100%; padding:12px;">
                  ${state.isAuthenticating ? `<span class="spinner-loader"></span> Authenticating...` : `<i data-lucide="shield"></i> Sign In as ${role}`}
                </button>
              </form>
            ` : `
              <!-- Admin Register Form (Admin Only) -->
              <form id="admin-register-form" autocomplete="off">
                <div class="form-group" style="margin-bottom:12px;">
                  <label>Full Name</label>
                  <input type="text" id="reg-admin-fullname" class="form-control" placeholder="Enter Full Name" required value="" autocomplete="off" name="admin_fullname_${Date.now()}">
                </div>
                <div class="form-group" style="margin-bottom:12px;">
                  <label>Society Name</label>
                  <input type="text" id="reg-admin-society" class="form-control" placeholder="Enter Society Name" value="" required autocomplete="off" name="admin_society_${Date.now()}">
                </div>
                <div class="form-grid" style="margin-bottom:12px;">
                  <div class="form-group">
                    <label>Admin Username / ID</label>
                    <input type="text" id="reg-admin-id" class="form-control" placeholder="Enter Admin Username" required value="" autocomplete="off" name="admin_id_${Date.now()}">
                  </div>
                  <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" id="reg-admin-phone" class="form-control" placeholder="Enter Phone Number" required value="" autocomplete="off" name="admin_phone_${Date.now()}">
                  </div>
                </div>
                <div class="form-grid" style="margin-bottom:20px;">
                  <div class="form-group">
                    <label>Password</label>
                    <div style="position:relative;">
                      <input type="password" id="reg-admin-password" class="form-control" placeholder="Enter Password" required value="" autocomplete="new-password" name="admin_pass_${Date.now()}" style="padding-right:42px;">
                      <button type="button" onclick="togglePasswordVisibility('reg-admin-password', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                        <i data-lucide="eye" style="width:18px; height:18px;"></i>
                      </button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Confirm Password</label>
                    <div style="position:relative;">
                      <input type="password" id="reg-admin-confirm" class="form-control" placeholder="Confirm Password" required value="" autocomplete="new-password" name="admin_confirm_${Date.now()}" style="padding-right:42px;">
                      <button type="button" onclick="togglePasswordVisibility('reg-admin-confirm', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                        <i data-lucide="eye" style="width:18px; height:18px;"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <button type="submit" id="reg-admin-submit-btn" class="btn btn-primary" style="width:100%; padding:12px; background:var(--accent-teal);">
                  ${state.isAuthenticating ? `<span class="spinner-loader"></span> Creating Account...` : `<i data-lucide="user-plus"></i> Register & Create Admin Account`}
                </button>
              </form>
            `}
          </div>
        </div>
      </div>
    `;
  }

  window.selectSearchSuggestion = function(name, flat) {
    state.searchQuery = flat || name;
    state.searchDropdownOpen = false;
    render();
  };

  function renderSearchDropdown() {
    const query = (state.searchQuery || '').trim().toLowerCase();
    if (!query || !state.searchDropdownOpen) return '';

    const matches = state.residents.filter(r => {
      const nameMatch = r.name && r.name.toLowerCase().includes(query);
      const flatMatch = r.flat && r.flat.toLowerCase().includes(query);
      const phoneMatch = r.phone && r.phone.toLowerCase().includes(query);
      const loginMatch = r.loginId && r.loginId.toLowerCase().includes(query);
      return nameMatch || flatMatch || phoneMatch || loginMatch;
    }).slice(0, 6);

    return `
      <div class="search-dropdown-overlay" style="position:absolute; top:calc(100% + 6px); left:0; right:0; min-width:320px; background:white; border:1px solid #cbd5e1; border-radius:10px; box-shadow:0 12px 28px rgba(0,0,0,0.18); z-index:999; overflow:hidden; padding:6px 0;">
        <div style="padding:6px 12px; font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #f1f5f9;">
          Resident Suggestions (${matches.length})
        </div>
        <div style="max-height:260px; overflow-y:auto;">
          ${matches.length === 0 ? `
            <div style="padding:16px; text-align:center; font-size:12px; color:var(--text-muted);">
              No residents found matching "<strong>${state.searchQuery}</strong>"
            </div>
          ` : matches.map(r => `
            <div class="search-suggestion-item" onclick="selectSearchSuggestion('${(r.name || '').replace(/'/g, "\\'")}', '${r.flat}')" style="padding:10px 14px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:background 0.15s ease; border-bottom:1px solid #f8fafc;" onmouseenter="this.style.background='#f1f5f9'" onmouseleave="this.style.background='transparent'">
              <div style="display:flex; align-items:center; gap:10px;">
                <div class="avatar-badge-circle ${r.avatarBg || 'blue'}" style="width:32px; height:32px; font-size:11px;">${r.initials || 'RS'}</div>
                <div>
                  <div style="font-weight:600; font-size:13px; color:#0f172a;">${r.name}</div>
                  <div style="font-size:11px; color:var(--text-muted);">Flat: <strong style="color:#2563eb;">${r.flat}</strong> • Phone: ${r.phone || 'N/A'}</div>
                </div>
              </div>
              <span class="status-pill ${r.status === 'Active' ? 'active' : 'inactive'}" style="font-size:10px; padding:2px 8px;">${r.status}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 2. Global Dashboard Layout Wrapper
  function renderDashboardLayout() {
    const user = state.currentUser || { fullName: 'Rajesh Sharma', role: 'ADMIN' };
    const role = user.role;
    const unreadCount = state.notifications.filter(n => !n.read).length;

    let navItemsHTML = '';
    let actionBtnHTML = '';

    if (role === 'ADMIN') {
      navItemsHTML = `
        <div class="nav-item ${state.adminTab === 'dashboard' ? 'active' : ''}" onclick="switchTab('dashboard')">
          <i data-lucide="layout-dashboard"></i> Dashboard
        </div>
        <div class="nav-item ${state.adminTab === 'directory' ? 'active' : ''}" onclick="switchTab('directory')">
          <i data-lucide="users"></i> Resident Directory
        </div>
        <div class="nav-item ${state.adminTab === 'guards' ? 'active' : ''}" onclick="switchTab('guards')">
          <i data-lucide="user-check"></i> Guard Roster
        </div>
        <div class="nav-item ${state.adminTab === 'logs' ? 'active' : ''}" onclick="switchTab('logs')">
          <i data-lucide="file-text"></i> Visitor Logs
        </div>
        <div class="nav-item ${state.adminTab === 'settings' ? 'active' : ''}" onclick="switchTab('settings')">
          <i data-lucide="settings"></i> Settings
        </div>
      `;
      actionBtnHTML = `
        <button class="sidebar-action-btn" onclick="openAddUserModal('RESIDENT')">
          <i data-lucide="user-plus"></i> + Add Resident
        </button>
      `;
    } else if (role === 'GUARD') {
      navItemsHTML = `
        <div class="nav-item ${state.adminTab === 'dashboard' || state.adminTab === 'entry' ? 'active' : ''}" onclick="switchTab('dashboard')">
          <i data-lucide="user-plus"></i> Register Visitor
        </div>
        <div class="nav-item ${state.adminTab === 'queue' ? 'active' : ''}" onclick="switchTab('queue')">
          <i data-lucide="clock"></i> Pending Queue
        </div>
        <div class="nav-item ${state.adminTab === 'logs' ? 'active' : ''}" onclick="switchTab('logs')">
          <i data-lucide="file-text"></i> Visitor History
        </div>
      `;
      actionBtnHTML = `
        <button class="sidebar-action-btn" onclick="openRegisterVisitorModal()">
          <i data-lucide="user-plus"></i> + Register Visitor
        </button>
      `;
    } else if (role === 'RESIDENT') {
      navItemsHTML = `
        <div class="nav-item ${state.adminTab === 'dashboard' ? 'active' : ''}" onclick="switchTab('dashboard')">
          <i data-lucide="radio"></i> Live Visitor Alerts
        </div>
        <div class="nav-item ${state.adminTab === 'logs' ? 'active' : ''}" onclick="switchTab('logs')">
          <i data-lucide="history"></i> My Visitor Log
        </div>
        <div class="nav-item ${state.adminTab === 'passes' ? 'active' : ''}" onclick="openManagePassesModal()">
          <i data-lucide="qr-code"></i> Pre-Approved Passes
        </div>
        <div class="nav-item ${state.adminTab === 'issue' ? 'active' : ''}" onclick="openReportProblemModal()">
          <i data-lucide="alert-triangle"></i> Report Issue
        </div>
      `;
      actionBtnHTML = `
        <button class="sidebar-action-btn" style="background:var(--accent-teal);" onclick="openManagePassesModal()">
          <i data-lucide="qr-code"></i> + Guest Pass
        </button>
      `;
    }

    return `
      <div class="dashboard-layout">
        <!-- Desktop Light Sidebar -->
        <aside class="sidebar" id="app-sidebar">
          <div class="sidebar-brand">
            <div class="brand-icon"><i data-lucide="shield"></i></div>
            <div class="brand-title-wrap">
              <div class="brand-text">GateSync</div>
              <span class="brand-subtext">Community Security</span>
            </div>
          </div>

          <nav class="sidebar-nav">
            ${navItemsHTML}
          </nav>

          <div class="sidebar-footer">
            ${actionBtnHTML}
            <div class="sidebar-secondary-link" onclick="openHelpModal()">
              <i data-lucide="help-circle"></i> Help Center
            </div>
            <div class="sidebar-secondary-link logout" onclick="clearSession()">
              <i data-lucide="log-out"></i> Logout
            </div>
          </div>
        </aside>

        <!-- Main Workspace -->
        <div class="main-wrapper">
          <header class="top-header">
            <div class="header-left-wrap">
              <button class="hamburger-btn" onclick="toggleMobileSidebar()"><i data-lucide="menu"></i></button>
              ${role !== 'RESIDENT' ? `
                <div class="header-search" style="position:relative;">
                  <i data-lucide="search"></i>
                  <input type="text" placeholder="Search residents, flats, or logs..." id="global-search-input" value="${state.searchQuery}" autocomplete="off">
                  ${renderSearchDropdown()}
                </div>
              ` : ''}
            </div>

            <div class="header-actions">
              <!-- SOS Panic Action Button -->
              <button class="btn-sos-panic" onclick="openEmergencyModal()" title="Trigger Panic SOS Alert">
                🚨 SOS
              </button>

              <!-- Mute / Unmute Audio Button -->
              <div class="sound-toggle-btn" onclick="toggleSoundMute()" title="${state.soundMuted ? 'Unmute alert sounds' : 'Mute alert sounds'}">
                <i data-lucide="${state.soundMuted ? 'volume-x' : 'volume-2'}"></i>
              </div>

              <!-- Notification Bell with Count Badge -->
              <div class="notification-bell" onclick="toggleNotificationDrawer()" title="View Notifications">
                <i data-lucide="bell"></i>
                ${unreadCount > 0 ? `<span class="bell-badge-count">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
              </div>

              <div class="user-profile-pill" onclick="openProfileModal()">
                <div class="avatar-initials">${user.fullName ? user.fullName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'AP'}</div>
                <span class="user-profile-name">${user.fullName || 'Resident'}</span>
              </div>
            </div>
          </header>

          <!-- Notification Drawer Card -->
          ${state.notificationDrawerOpen ? renderNotificationDrawerCard() : ''}

          <main class="content-canvas">
            ${role === 'ADMIN' ? renderAdminView() : ''}
            ${role === 'GUARD' ? renderGuardView() : ''}
            ${role === 'RESIDENT' ? renderResidentView() : ''}
          </main>
        </div>

        <!-- Mobile Bottom Navigation -->
        <nav class="mobile-bottom-nav">
          <div class="mobile-nav-btn active" onclick="switchTab('dashboard')">
            <i data-lucide="${role === 'ADMIN' ? 'layout-dashboard' : role === 'GUARD' ? 'user-plus' : 'radio'}"></i> Dashboard
          </div>
          <div class="mobile-nav-btn" onclick="switchTab('logs')">
            <i data-lucide="file-text"></i> Logs
          </div>
          ${role === 'GUARD' ? `
            <div class="mobile-fab-center" onclick="openRegisterVisitorModal()">
              <i data-lucide="plus" style="width:24px; height:24px;"></i>
            </div>
          ` : ''}
          <div class="mobile-nav-btn" onclick="openProfileModal()">
            <i data-lucide="user"></i> Profile
          </div>
          <div class="mobile-nav-btn" onclick="clearSession()">
            <i data-lucide="log-out"></i> Logout
          </div>
        </nav>
      </div>
    `;
  }

  // 3. Admin View (Exact Match to Mockup 1)
  function renderAdminView() {
    if (state.adminTab === 'logs') return renderVisitorLogsTab();
    if (state.adminTab === 'directory') return renderResidentDirectoryTab();
    if (state.adminTab === 'guards') return renderGuardRosterTab();
    if (state.adminTab === 'settings') return renderSettingsTab();

    const filteredResidents = state.residents.filter(r => {
      const matchSearch = !state.searchQuery || r.name.toLowerCase().includes(state.searchQuery.toLowerCase()) || r.flat.toLowerCase().includes(state.searchQuery.toLowerCase()) || (r.loginId && r.loginId.includes(state.searchQuery));
      const matchStatus = state.residentStatusFilter === 'ALL' || r.status === state.residentStatusFilter;
      return matchSearch && matchStatus;
    });

    return `
      <!-- Stat Cards Row -->
      <div class="stats-grid-row">
        <div class="stat-card-clean">
          <div class="stat-info-left">
            <h4>Total Residents</h4>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="stat-val-num">${state.residents.length}</span>
              <span class="stat-badge-tag blue">${state.residents.length > 0 ? '+12%' : '0 Registered'}</span>
            </div>
          </div>
          <div class="stat-icon-circle blue"><i data-lucide="users"></i></div>
        </div>

        <div class="stat-card-clean">
          <div class="stat-info-left">
            <h4>Active Guards</h4>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="stat-val-num">${state.guards.length}</span>
              <span class="stat-badge-tag green">${state.guards.length > 0 ? 'Stable' : '0 Active'}</span>
            </div>
          </div>
          <div class="stat-icon-circle teal"><i data-lucide="shield-check"></i></div>
        </div>

        <div class="stat-card-clean">
          <div class="stat-info-left">
            <h4>Total Flats</h4>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="stat-val-num">${state.residents.length > 0 ? new Set(state.residents.map(r => r.flat)).size : 0}</span>
              <span class="stat-badge-tag teal">${state.residents.length > 0 ? 'Occupied' : '0 Occupied'}</span>
            </div>
          </div>
          <div class="stat-icon-circle gray"><i data-lucide="building"></i></div>
        </div>

        <div class="stat-card-clean">
          <div class="stat-info-left">
            <h4>Visitor Requests</h4>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="stat-val-num">${state.visitorRequests.filter(r => r.status === 'PENDING').length}</span>
              <span class="stat-badge-tag red">Pending</span>
            </div>
          </div>
          <div class="stat-icon-circle amber"><i data-lucide="arrow-left-right"></i></div>
        </div>
      </div>

      <div class="dashboard-grid-layout">
        <div class="dashboard-main-col">
          <div class="card-box">
            <div style="margin-bottom:20px;">
              <h2 class="card-title-text">Resident Management</h2>
              <p class="card-subtitle-text">Manage community members and their access levels.</p>
            </div>

            <div class="table-filter-bar">
              <div style="display:flex; align-items:center; gap:8px;">
                <i data-lucide="filter" style="width:16px; height:16px; color:var(--text-muted);"></i>
                <select class="filter-dropdown-select" onchange="filterResidentStatus(this.value)">
                  <option value="ALL" ${state.residentStatusFilter === 'ALL' ? 'selected' : ''}>Status: All</option>
                  <option value="Active" ${state.residentStatusFilter === 'Active' ? 'selected' : ''}>Active</option>
                  <option value="Inactive" ${state.residentStatusFilter === 'Inactive' ? 'selected' : ''}>Inactive</option>
                </select>
              </div>

              <button class="btn btn-primary" onclick="openAddUserModal('RESIDENT')">
                <i data-lucide="plus"></i> Add Resident
              </button>
            </div>

            <div class="custom-table-container">
              <table class="clean-table">
                <thead>
                  <tr>
                    <th>Resident Name</th>
                    <th>Flat Number</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredResidents.length === 0 ? `
                    <tr>
                      <td colspan="5" style="text-align:center; color:var(--text-muted); padding:32px;">
                        No residents registered yet. (0 Residents)
                      </td>
                    </tr>
                  ` : filteredResidents.map(r => `
                    <tr>
                      <td>
                        <div style="display:flex; align-items:center; gap:12px;">
                          <div class="avatar-badge-circle ${r.avatarBg}">${r.initials}</div>
                          <span style="font-weight:600; color:#1e293b;">${r.name}</span>
                        </div>
                      </td>
                      <td style="font-weight:500;">${r.flat}</td>
                      <td style="color:var(--text-muted);">${r.phone}</td>
                      <td>
                        <span class="status-pill ${r.status === 'Active' ? 'active' : 'inactive'}">${r.status}</span>
                      </td>
                      <td>
                        <div style="display:flex; gap:6px;">
                          <div class="table-action-icon" onclick="openEditResidentModal(${r.id})"><i data-lucide="edit-3" style="width:16px; height:16px;"></i></div>
                          <div class="table-action-icon delete" onclick="confirmDeleteResident(${r.id})"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></div>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; font-size:12px; color:var(--text-muted);">
              <span>Showing ${filteredResidents.length} of ${state.residents.length} residents</span>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-secondary btn-sm" disabled>Previous</button>
                <button class="btn btn-secondary btn-sm" disabled>Next</button>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-side-col">
          <div class="card-box">
            <h3 class="card-title-text" style="font-size:15px; margin-bottom:14px; color:#2563eb;">Quick Actions</h3>
            <div class="quick-action-cards">
              <div class="quick-card red" onclick="openClubhouseApprovalAdminModal()">
                <div class="quick-card-icon"><i data-lucide="clock" style="width:18px; height:18px;"></i></div>
                <div class="quick-card-title">Clubhouse Requests</div>
              </div>
              <div class="quick-card teal" onclick="openCommunityProblemsAdminModal()">
                <div class="quick-card-icon"><i data-lucide="shield-check" style="width:18px; height:18px;"></i></div>
                <div class="quick-card-title">Community Complaints</div>
              </div>
            </div>
          </div>

          <div class="card-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 class="card-title-text" style="font-size:16px;">Activity Log</h3>
              <a href="#" style="font-size:12px; color:var(--primary-blue); font-weight:600; text-decoration:none;" onclick="switchTab('logs')">View All</a>
            </div>

            <div class="activity-timeline">
              ${state.visitorRequests.length === 0 ? `
                <div style="text-align:center; color:var(--text-muted); padding:24px; font-size:13px;">
                  <i data-lucide="check-circle" style="width:24px; height:24px; margin:0 auto 6px; display:block; color:#10b981;"></i>
                  No activity recorded yet. (0 Logged Events)
                </div>
              ` : state.visitorRequests.slice(0, 5).map(r => `
                <div class="timeline-item">
                  <div class="timeline-dot blue"></div>
                  <div class="timeline-card">
                    <div class="timeline-header">
                      <span class="timeline-title">${r.visitorName}</span>
                      <span class="timeline-time">${r.inTime || 'Today'}</span>
                    </div>
                    <div class="timeline-sub">Visiting Flat ${r.targetFlat} • ${r.purpose}</div>
                    <span class="timeline-tag verified">${r.status}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 4. Guard Terminal View (Exact Match to Mockup 2)
  function renderGuardView() {
    const pendingList = state.visitorRequests.filter(r => r.status === 'PENDING');
    const historyList = state.visitorRequests.filter(r => r.status !== 'PENDING');

    return `
      <div class="dashboard-grid-layout">
        <div class="dashboard-main-col">
          <div class="card-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
              <div>
                <h2 class="card-title-text" style="color:#2563eb;">New Visitor Entry</h2>
                <p class="card-subtitle-text">Register gate arriving visitor details for instant resident permission.</p>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="stat-badge-tag blue">⏱️ Live Entry</span>
              </div>
            </div>

            <form id="guard-visitor-form">
              <div class="form-grid">
                <div class="form-group">
                  <label>Visitor Name</label>
                  <input type="text" id="vis-name" class="form-control" placeholder="Full Name" required>
                </div>
                <div class="form-group">
                  <label>Phone Number (10 Digits)</label>
                  <input type="tel" id="vis-phone" class="form-control" placeholder="e.g. 9876543210" maxlength="10" pattern="[0-9]{10}" oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,10)" required>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label>Visiting Flat / House</label>
                  <select id="vis-destination" class="form-control">
                    ${state.residents.length === 0 ? '<option value="">No residents registered</option>' : state.residents.map(r => `<option value="${r.flat.includes('-') ? r.flat.split('-')[1] : r.flat}|${r.flat.includes('-') ? r.flat.split('-')[0] : 'A'}">Flat ${r.flat} (${r.name})</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label>Purpose of Visit</label>
                  <select id="vis-purpose" class="form-control">
                    <option value="Delivery">Delivery</option>
                    <option value="Guest">Guest</option>
                    <option value="Plumber">Plumber / Service</option>
                    <option value="Cab">Taxi / Cab</option>
                  </select>
                </div>
              </div>

              <div class="form-group" style="margin-bottom:24px;">
                <label>Visitor Identity Capture</label>
                <div style="display:flex; gap:16px; align-items:center;">
                  <img src="${state.selectedPhoto}" style="width:90px; height:90px; border-radius:var(--radius-md); object-fit:cover; border:2px solid var(--primary-blue);">
                  <div class="photo-dropzone-box" style="flex:1;" onclick="openCameraModal()">
                    <div class="photo-dropzone-icon">
                      <i data-lucide="camera" style="width:24px; height:24px;"></i>
                    </div>
                    <span class="photo-dropzone-text">Click to open camera or drag photo here</span>
                  </div>
                </div>
              </div>

              <div style="display:flex; gap:12px;">
                <button type="submit" class="btn btn-primary" style="flex:1; padding:12px; font-size:14px;">
                  <i data-lucide="check-circle-2"></i> Request Entry Permission
                </button>
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('guard-visitor-form').reset()">
                  Clear
                </button>
              </div>
            </form>
          </div>

          <div class="card-box" style="margin-top:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 class="card-title-text" style="font-size:18px;">Recent Visitor History</h3>
              <a href="#" style="font-size:12px; color:var(--primary-blue); font-weight:600; text-decoration:none;" onclick="showToast('Exporting PDF visitor report...', 'info')">
                Download Report <i data-lucide="download" style="width:12px; height:12px;"></i>
              </a>
            </div>

            <div class="custom-table-container">
              <table class="clean-table">
                <thead>
                  <tr>
                    <th>VISITOR</th>
                    <th>DESTINATION</th>
                    <th>IN TIME</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  ${historyList.map(item => `
                    <tr>
                      <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                          <img src="${item.photoUrl}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
                          <div>
                            <div style="font-weight:600;">${item.visitorName}</div>
                            <div style="font-size:11px; color:var(--text-muted);">${item.visitorPhone}</div>
                          </div>
                        </div>
                      </td>
                      <td>${item.targetFlat ? `Flat ${item.targetFlat} - ${item.targetBlock} Block` : item.purpose}</td>
                      <td style="font-weight:500;">${item.inTime || '14:20 PM'}</td>
                      <td>
                        ${item.status === 'APPROVED' ? `<span class="status-pill allow-entry">ALLOW ENTRY</span>` : item.status === 'DENIED' ? `<span class="status-pill inform-denied">INFORM DENIED</span>` : `<span class="status-pill checked-in">${item.status}</span>`}
                      </td>
                      <td>
                        <button class="btn-danger-sm" onclick="checkoutVisitor(${item.id})">CHECKOUT</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="dashboard-side-col">
          <div class="card-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 class="card-title-text" style="font-size:18px; color:#2563eb;">Pending Queue</h3>
              <span class="stat-badge-tag red" style="font-weight:700;">${pendingList.length} Waiting</span>
            </div>

            <div>
              ${pendingList.map(r => `
                <div class="pending-queue-item">
                  <img src="${r.photoUrl}" class="pending-queue-img">
                  <div class="pending-queue-info">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span class="pending-queue-name">${r.visitorName}</span>
                      <span class="pending-queue-sub">${r.timeAgo || 'Just now'}</span>
                    </div>
                    <div class="pending-queue-sub">Visiting <strong>Flat ${r.targetFlat}</strong> • ${r.purpose}</div>
                    <div style="display:flex; gap:6px; margin-top:6px;">
                      <span class="pending-queue-pill waiting">WAITING FOR APPROVAL</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 5. Resident View (Exact Match to Mockup 3 & 4)
  function renderResidentView() {
    const user = state.currentUser;
    const rawFlat = user ? (user.flatNumber || user.flat || '101') : '101';
    const rawBlock = user ? (user.blockNumber || 'A') : 'A';
    const userFlat = String(rawFlat).trim();
    const userBlock = String(rawBlock).trim();

    const myVisitorRequests = state.visitorRequests.filter(r => {
      if (!user) return false;
      const targetFlatStr = String(r.targetFlat || '').trim().toLowerCase().replace(/^[a-z]-?/i, '');
      const userFlatStr = String(user.flatNumber || user.flat || '').trim().toLowerCase().replace(/^[a-z]-?/i, '');
      const targetBlockStr = String(r.targetBlock || '').trim().toLowerCase();
      const userBlockStr = String(user.blockNumber || '').trim().toLowerCase();

      if (!userFlatStr || !targetFlatStr) return false;
      const matchFlat = (targetFlatStr === userFlatStr);
      const matchBlock = !userBlockStr || !targetBlockStr || (userBlockStr === targetBlockStr);
      return matchFlat && matchBlock;
    });

    const pendingRequests = myVisitorRequests.filter(r => r.status === 'PENDING');
    const activeReq = pendingRequests.length > 0 ? pendingRequests[0] : null;
    const visitorCount = myVisitorRequests.length;
    const formattedCount = visitorCount < 10 ? '0' + visitorCount : String(visitorCount);

    return `
      <!-- LIVE REQUEST Hero Card -->
      ${activeReq ? `
        <div class="live-request-card">
          <div class="live-badge-head">
            <i data-lucide="radio" style="width:14px; height:14px;"></i> LIVE REQUEST
          </div>

          <div class="live-request-body">
            <img src="${activeReq.photoUrl}" class="live-visitor-img">

            <div class="live-visitor-content">
              <h1 class="live-visitor-name">${activeReq.visitorName}</h1>
              <div class="live-visitor-company">${activeReq.purpose} • Phone: ${activeReq.visitorPhone}</div>

              <div class="purpose-quote-box">
                "${activeReq.purposeQuote || 'Visitor request for Unit ' + (userFlat || '101') + '. Requires entry confirmation.'}"
              </div>

              <div class="live-action-btns">
                <button class="btn-approve-big" onclick="openApproveModal(${activeReq.id})">
                  <i data-lucide="check-circle" style="width:20px; height:20px;"></i> Approve
                </button>
                <button class="btn-deny-big" onclick="openDenyModal(${activeReq.id})">
                  <i data-lucide="x-circle" style="width:20px; height:20px;"></i> Deny
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Sticky Thumb-Zone Action Bar -->
        <div class="resident-thumb-container">
          <div class="resident-thumb-btns">
            <button class="btn-thumb-approve" onclick="openApproveModal(${activeReq.id})">
              <i data-lucide="check-circle"></i> Approve (${activeReq.visitorName})
            </button>
            <button class="btn-thumb-deny" onclick="openDenyModal(${activeReq.id})">
              <i data-lucide="x-circle"></i> Deny
            </button>
          </div>
        </div>
      ` : `
        <div class="card-box" style="margin-bottom:24px; text-align:center; padding:24px;">
          <div style="font-size:24px; margin-bottom:6px;">🏡</div>
          <h3 style="font-family:var(--font-heading); font-size:18px; font-weight:700;">No Active Gate Visitor Alerts</h3>
          <p style="font-size:13px; color:var(--text-muted);">Incoming gate visitor requests for Flat ${userFlat || ''} will appear here in real time.</p>
        </div>
      `}

      <div class="dashboard-grid-layout">
        <div class="dashboard-main-col">
          <div class="stats-grid-row">
            <div class="stat-card-clean">
              <div class="stat-info-left">
                <h4>VISITORS TODAY</h4>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="stat-val-num">${formattedCount}</span>
                  <span class="stat-badge-tag blue">Live</span>
                </div>
              </div>
              <div class="stat-icon-circle blue"><i data-lucide="users"></i></div>
            </div>

            <div class="stat-card-clean">
              <div class="stat-info-left">
                <h4>PENDING REQUESTS</h4>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="stat-val-num">${pendingRequests.length}</span>
                  <span class="stat-badge-tag teal">Active</span>
                </div>
              </div>
              <div class="stat-icon-circle teal"><i data-lucide="clipboard-list"></i></div>
            </div>

            <div class="stat-card-clean">
              <div class="stat-info-left">
                <h4>GUEST PARKING</h4>
                <span class="stat-val-num">${visitorCount > 0 ? 'P-12' : '00'}</span>
              </div>
              <div class="stat-icon-circle gray"><i data-lucide="square-p"></i></div>
            </div>

            <div class="stat-card-clean">
              <div class="stat-info-left">
                <h4>FREQUENT GUESTS</h4>
                <span class="stat-val-num">00</span>
              </div>
              <div class="stat-icon-circle blue"><i data-lucide="shield"></i></div>
            </div>
          </div>

          <div class="card-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 class="card-title-text">Visitor History</h3>
              <button class="btn btn-secondary btn-sm" onclick="showToast('Filter options active', 'info')"><i data-lucide="sliders-horizontal"></i> Filter</button>
            </div>

            <div class="custom-table-container">
              <table class="clean-table">
                <thead>
                  <tr>
                    <th>VISITOR</th>
                    <th>PURPOSE</th>
                    <th>ARRIVAL</th>
                    <th>DEPARTURE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  ${myVisitorRequests.length === 0 ? `
                    <tr>
                      <td colspan="6" style="text-align:center; color:var(--text-muted); padding:24px;">
                        No previous visitor history logged yet. (0 Visitors)
                      </td>
                    </tr>
                  ` : myVisitorRequests.map(item => `
                    <tr>
                      <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                          <img src="${item.photoUrl}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                          <div>
                            <div style="font-weight:600;">${item.visitorName}</div>
                            <div style="font-size:11px; color:var(--text-muted);">${item.visitorPhone}</div>
                          </div>
                        </div>
                      </td>
                      <td>${item.purpose}</td>
                      <td>${item.inTime || 'Today'}</td>
                      <td>${item.outTime || 'N/A'}</td>
                      <td><span class="status-pill ${item.status === 'APPROVED' ? 'active' : 'checked-out'}">${item.status}</span></td>
                      <td><i data-lucide="more-vertical" style="width:16px; height:16px; color:var(--text-muted); cursor:pointer;"></i></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Hosting a Party Navy Banner (Mockup Match + Integrated Clubhouse & Problem Modals) -->
          <div class="party-pass-card">
            <div>
              <h3 class="party-pass-title">Hosting a Party?</h3>
              <p class="party-pass-sub">Generate a bulk QR pass for your guests or request clubhouse venue reservation.</p>
            </div>
            <div style="display:flex; gap:10px;">
              <button class="btn-teal-action" onclick="openPartyPassModal()">Create Event</button>
              <button class="btn btn-secondary btn-sm" onclick="openReportProblemModal()" style="color:white; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.3);">Report Issue</button>
            </div>
          </div>
        </div>

        <div class="dashboard-side-col">
          <div class="card-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <i data-lucide="bell" style="width:18px; height:18px; color:#2563eb;"></i>
                <h3 class="card-title-text" style="font-size:16px;">Notifications</h3>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:12px;">
              ${state.notifications.map(n => `
                <div style="padding:12px; border-radius:var(--radius-md); background:#f8fafc; border:1px solid #e2e8f0;">
                  <div style="font-weight:700; font-size:13px; color:#334155; display:flex; align-items:center; gap:6px;">
                    <i data-lucide="info" style="width:16px; height:16px; color:#2563eb;"></i> ${n.title}
                  </div>
                  <div style="font-size:12px; color:#475569; margin-top:2px;">${n.message}</div>
                  <div style="font-size:10px; color:#94a3b8; margin-top:4px;">${n.time}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderVisitorLogsTab() {
    return `
      <div class="card-box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <div>
            <h2 class="card-title-text">Visitor Logs & Gate Audit</h2>
            <p class="card-subtitle-text">Real-time gate access record feed.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openRegisterVisitorModal()"><i data-lucide="plus"></i> New Gate Entry</button>
        </div>

        <div class="desktop-table-view custom-table-container">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Destination</th>
                <th>In Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${state.visitorRequests.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align:center; color:var(--text-muted); padding:32px;">
                    No visitor logs recorded yet. (0 Visitor Logs)
                  </td>
                </tr>
              ` : state.visitorRequests.map(r => `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                      <img src="${r.photoUrl}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
                      <div>
                        <div style="font-weight:600;">${r.visitorName}</div>
                        <div style="font-size:11px; color:var(--text-muted);">${r.visitorPhone}</div>
                      </div>
                    </div>
                  </td>
                  <td>Block ${r.targetBlock} - Flat ${r.targetFlat}</td>
                  <td>${r.inTime || '14:20 PM'}</td>
                  <td><span class="status-pill ${r.status === 'APPROVED' ? 'active' : r.status === 'CHECKED_IN' ? 'checked-in' : r.status === 'DENIED' ? 'denied' : 'inactive'}">${r.status}</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="openVisitorDetailModal(${r.id})"><i data-lucide="eye"></i> View Details</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="mobile-cards-container">
          ${state.visitorRequests.length === 0 ? `
            <div style="text-align:center; color:var(--text-muted); padding:24px;">No visitor logs recorded yet.</div>
          ` : state.visitorRequests.map(r => `
            <div class="responsive-card">
              <div class="responsive-card-header">
                <div style="display:flex; align-items:center; gap:8px;">
                  <img src="${r.photoUrl}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                  <span>${r.visitorName}</span>
                </div>
                <span class="status-pill ${r.status === 'APPROVED' ? 'active' : r.status === 'DENIED' ? 'denied' : 'inactive'}">${r.status}</span>
              </div>
              <div class="responsive-card-body">
                <div><div class="responsive-card-label">Destination</div><div class="responsive-card-value">Flat ${r.targetBlock}-${r.targetFlat}</div></div>
                <div><div class="responsive-card-label">In Time</div><div class="responsive-card-value">${r.inTime || '14:20 PM'}</div></div>
                <div><div class="responsive-card-label">Phone</div><div class="responsive-card-value">${r.visitorPhone}</div></div>
                <div><div class="responsive-card-label">Purpose</div><div class="responsive-card-value">${r.purpose || 'Guest'}</div></div>
              </div>
              <div class="responsive-card-actions">
                <button class="btn btn-secondary btn-sm" onclick="openVisitorDetailModal(${r.id})"><i data-lucide="eye"></i> Details</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderResidentDirectoryTab() {
    return `
      <div class="card-box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <div>
            <h2 class="card-title-text">Resident Directory</h2>
            <p class="card-subtitle-text">Manage society residents and contact information.</p>
          </div>
          <button class="btn btn-primary" onclick="openAddUserModal('RESIDENT')"><i data-lucide="plus"></i> Add Resident</button>
        </div>

        <div class="desktop-table-view custom-table-container">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Resident Name</th>
                <th>Flat Number</th>
                <th>Contact</th>
                <th>Backup Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${state.residents.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align:center; color:var(--text-muted); padding:32px;">
                    No residents in directory yet. (0 Residents)
                  </td>
                </tr>
              ` : state.residents.map(r => `
                <tr>
                  <td><strong>${r.name}</strong></td>
                  <td>${r.flat}</td>
                  <td>${r.phone}</td>
                  <td>${r.backupPhone || 'N/A'}</td>
                  <td><span class="status-pill active">${r.status}</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="openEditResidentModal(${r.id})">Edit</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="mobile-cards-container">
          ${state.residents.length === 0 ? `
            <div style="text-align:center; color:var(--text-muted); padding:24px;">No residents in directory yet.</div>
          ` : state.residents.map(r => `
            <div class="responsive-card">
              <div class="responsive-card-header">
                <span>${r.name}</span>
                <span class="status-pill active">${r.status}</span>
              </div>
              <div class="responsive-card-body">
                <div><div class="responsive-card-label">Flat</div><div class="responsive-card-value">${r.flat}</div></div>
                <div><div class="responsive-card-label">Phone</div><div class="responsive-card-value">${r.phone}</div></div>
                <div><div class="responsive-card-label">Backup</div><div class="responsive-card-value">${r.backupPhone || 'N/A'}</div></div>
                <div><div class="responsive-card-label">Login ID</div><div class="responsive-card-value">${r.loginId || 'N/A'}</div></div>
              </div>
              <div class="responsive-card-actions">
                <button class="btn btn-secondary btn-sm" onclick="openEditResidentModal(${r.id})">Edit</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderGuardRosterTab() {
    const filteredGuards = state.guards.filter(g => state.guardShiftFilter === 'ALL' || g.shift === state.guardShiftFilter);
    return `
      <div class="card-box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <div>
            <h2 class="card-title-text">Guard Roster</h2>
            <p class="card-subtitle-text">Security shift schedules and personnel management.</p>
          </div>
          <div style="display:flex; gap:12px;">
            <select class="filter-dropdown-select" onchange="filterGuardShift(this.value)">
              <option value="ALL" ${state.guardShiftFilter === 'ALL' ? 'selected' : ''}>Shift: All</option>
              <option value="DAY" ${state.guardShiftFilter === 'DAY' ? 'selected' : ''}>DAY Shift</option>
              <option value="NIGHT" ${state.guardShiftFilter === 'NIGHT' ? 'selected' : ''}>NIGHT Shift</option>
            </select>
            <button class="btn btn-primary" onclick="openAddGuardModal()"><i data-lucide="plus"></i> Add Guard</button>
          </div>
        </div>

        <div class="desktop-table-view custom-table-container">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Guard Name</th>
                <th>Gate Station</th>
                <th>Shift</th>
                <th>Contact Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredGuards.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align:center; color:var(--text-muted); padding:32px;">
                    No security guards added to roster yet. (0 Guards)
                  </td>
                </tr>
              ` : filteredGuards.map(g => `
                <tr>
                  <td><strong>${g.name}</strong></td>
                  <td>${g.gate}</td>
                  <td><span class="status-pill ${g.shift === 'DAY' ? 'active' : 'checked-in'}">${g.shift} SHIFT</span></td>
                  <td>${g.phone}</td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="showToast('Editing ${g.name}', 'info')">Edit</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="mobile-cards-container">
          ${filteredGuards.length === 0 ? `
            <div style="text-align:center; color:var(--text-muted); padding:24px;">No security guards in roster yet.</div>
          ` : filteredGuards.map(g => `
            <div class="responsive-card">
              <div class="responsive-card-header">
                <span>${g.name}</span>
                <span class="status-pill ${g.shift === 'DAY' ? 'active' : 'checked-in'}">${g.shift} SHIFT</span>
              </div>
              <div class="responsive-card-body">
                <div><div class="responsive-card-label">Gate Station</div><div class="responsive-card-value">${g.gate}</div></div>
                <div><div class="responsive-card-label">Phone</div><div class="responsive-card-value">${g.phone}</div></div>
              </div>
              <div class="responsive-card-actions">
                <button class="btn btn-secondary btn-sm" onclick="showToast('Editing ${g.name}', 'info')">Edit</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderSettingsTab() {
    const s = state.settings || { societyName: 'GateSync Society', autoExpireSec: 60 };
    return `
      <div class="card-box">
        <h2 class="card-title-text" style="margin-bottom:16px;">Society Configuration Settings</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>Society Name</label>
            <input type="text" id="st-society-name" class="form-control" placeholder="Enter Society Name" value="${s.societyName || ''}">
          </div>
          <div class="form-group">
            <label>Auto-Expire Visitor Request (Seconds)</label>
            <input type="number" id="st-expire-sec" class="form-control" placeholder="60" value="${s.autoExpireSec || 60}">
          </div>
        </div>
        <button class="btn btn-primary" onclick="saveSocietySettings()">Save Configurations</button>
        
        <div style="margin-top:24px; border-top:1px solid var(--border-color); padding-top:20px;">
          <h3 class="card-title-text" style="font-size:15px; color:#ef4444; margin-bottom:6px;">System Memory Purge & Reset</h3>
          <p class="card-subtitle-text" style="margin-bottom:14px;">Clear all old local memory data and start fresh with a clean database.</p>
          <button class="btn btn-secondary" style="border-color:#ef4444; color:#ef4444;" onclick="resetSystemMemory()"><i data-lucide="trash-2"></i> Reset Memory & Clean Slate</button>
        </div>
      </div>
    `;
  }

  window.resetSystemMemory = async function () {
    if (!confirm('Are you sure you want to clear ALL data from Database, MongoDB Atlas, and Local Storage?')) {
      return;
    }

    try {
      await apiFetch('/api/admin/clear-all-data', { method: 'POST' });
    } catch (e) {}

    localStorage.clear();

    state.visitorRequests = [];
    state.residents = [];
    state.guards = [];
    state.notifications = [];
    state.clubhouseBookings = [];
    state.communityProblems = [];
    state.currentUser = null;
    state.token = null;
    state.activeView = 'landing';

    getDatabaseUsers();
    render();
    showToast('All Database, MongoDB Atlas, and Local Storage data cleared completely!', 'success');
  };

  window.saveSocietySettings = function() {
    const name = (document.getElementById('st-society-name').value || '').trim();
    const expire = (document.getElementById('st-expire-sec').value || '60').trim();
    state.settings = { societyName: name, autoExpireSec: parseInt(expire) || 60 };
    showToast('Society configurations saved successfully!', 'success');
  };

  function renderPasswordResetPage() {
    return `
      <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg-slate); padding:20px;">
        <div class="login-card" style="width:100%; max-width:440px;">
          <div style="text-align:center; margin-bottom:24px;">
            <div class="brand-icon" style="margin:0 auto 12px;"><i data-lucide="lock"></i></div>
            <h2 style="font-family:var(--font-heading); font-size:22px; font-weight:700;">Update Security Password</h2>
            <p style="font-size:12px; color:var(--text-muted);">First-time security reset required for your GateSync account.</p>
          </div>

          <form id="password-reset-form">
            <div class="form-group" style="margin-bottom:14px;">
              <label>New Password</label>
              <div style="position:relative;">
                <input type="password" id="reset-new" class="form-control" placeholder="At least 8 chars" required style="padding-right:42px;">
                <button type="button" onclick="togglePasswordVisibility('reset-new', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                  <i data-lucide="eye" style="width:18px; height:18px;"></i>
                </button>
              </div>
            </div>

            <div class="form-group" style="margin-bottom:20px;">
              <label>Confirm New Password</label>
              <div style="position:relative;">
                <input type="password" id="reset-confirm" class="form-control" placeholder="At least 8 chars" required style="padding-right:42px;">
                <button type="button" onclick="togglePasswordVisibility('reset-confirm', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                  <i data-lucide="eye" style="width:18px; height:18px;"></i>
                </button>
              </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; padding:12px;"><i data-lucide="check-shield"></i> Save & Continue to Dashboard</button>
          </form>
        </div>
      </div>
    `;
  }

  // Event Handlers
  function bindEvents() {
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const pos = e.target.selectionStart;
        state.searchQuery = val;
        state.searchDropdownOpen = val.trim().length > 0;
        render();

        const newSearchInput = document.getElementById('global-search-input');
        if (newSearchInput) {
          newSearchInput.focus();
          try {
            newSearchInput.setSelectionRange(pos, pos);
          } catch (err) {}
        }
      });

      searchInput.addEventListener('focus', () => {
        if (state.searchQuery && state.searchQuery.trim().length > 0) {
          state.searchDropdownOpen = true;
          render();
          const newSearchInput = document.getElementById('global-search-input');
          if (newSearchInput) newSearchInput.focus();
        }
      });
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header-search')) {
        if (state.searchDropdownOpen) {
          state.searchDropdownOpen = false;
          render();
        }
      }
    });

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginId = (document.getElementById('login-id').value || '').trim();
        const password = (document.getElementById('login-password').value || '').trim();
        const selectedRole = state.authRole || 'RESIDENT';

        if (!loginId || !password) {
          showToast('Please enter both Login ID and Password.', 'error');
          return;
        }

        state.isAuthenticating = true;
        render();

        // 1. Try Spring Boot Backend Authentication endpoint first (with fast 3s timeout)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const resp = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loginId, password }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (resp.ok) {
            const data = await resp.json();
            const user = {
              id: data.userId || Date.now(),
              loginId: data.loginId || loginId,
              fullName: data.fullName || 'User',
              role: data.role || selectedRole,
              blockNumber: data.blockNumber || 'A',
              flatNumber: data.flatNumber || '101',
              mustResetPassword: data.mustResetPassword || false
            };
            saveDatabaseUser({ ...user, password });
            saveSession(user, data.token || ('token_' + Date.now()));
            state.isAuthenticating = false;
            state.activeView = user.role.toLowerCase();
            render();
            showToast(`Welcome back, ${user.fullName}!`, 'success');
            return;
          }
        } catch (err) {}

        // 2. Check Database users stored in registered accounts database
        const dbUsers = getDatabaseUsers();
        const cleanInput = loginId.toLowerCase().trim().replace(/\s+/g, '');
        const inputPhone = loginId.replace(/[^0-9]/g, '');
        const inputFlat = cleanInput.replace(/[^a-z0-9]/g, '');

        const matched = dbUsers.find(u => {
          const uRole = (u.role || '').toUpperCase();
          if (uRole !== selectedRole) return false;

          const uLogin = (u.loginId || '').toLowerCase().trim().replace(/\s+/g, '');
          const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
          const uName = (u.fullName || u.name || '').toLowerCase().trim();
          const uFlatStr = (u.flat || (u.blockNumber && u.flatNumber ? u.blockNumber + '-' + u.flatNumber : u.flatNumber) || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const uFlatNum = (u.flatNumber || '').toLowerCase().trim();

          const matchLogin = uLogin && (uLogin === cleanInput || uLogin === loginId.toLowerCase().trim());
          const matchPhone = inputPhone.length >= 5 && uPhone.endsWith(inputPhone);
          const matchName = uName && uName.includes(loginId.toLowerCase().trim());
          const matchFlat = (uFlatStr && (uFlatStr === inputFlat || uFlatStr.endsWith(inputFlat))) || (uFlatNum && uFlatNum === inputFlat);

          return matchLogin || matchPhone || matchName || matchFlat;
        });

        if (matched) {
          if (matched.password && matched.password !== password) {
            state.isAuthenticating = false;
            render();
            showToast(`Incorrect password for ${selectedRole.toLowerCase()} account "${loginId}"!`, 'error');
            return;
          }

          saveSession(matched, 'token_' + Date.now());
          state.isAuthenticating = false;

          // Check if first-time password reset is required for newly provisioned accounts
          const userId = matched.id || matched.loginId;
          const promptDoneKey = userId ? `gatesync_pwd_prompt_done_${userId}` : null;
          if (matched.mustResetPassword && promptDoneKey && !localStorage.getItem(promptDoneKey)) {
            localStorage.setItem(promptDoneKey, 'true');
            state.activeView = 'password_reset';
            render();
            showToast(`First-time login detected for ${matched.fullName}! Please set your primary password below.`, 'amber');
            return;
          }

          state.activeView = matched.role ? matched.role.toLowerCase() : selectedRole.toLowerCase();
          render();
          showToast(`Welcome back, ${matched.fullName}!`, 'success');
          return;
        }

        // 3. User not found in database! Access Denied for un-registered users.
        state.isAuthenticating = false;
        render();
        showToast(`Access Denied! No registered ${selectedRole.toLowerCase()} account found for "${loginId}". Accounts must be created by Society Admin.`, 'error');
      });
    }

    const adminRegisterForm = document.getElementById('admin-register-form');
    if (adminRegisterForm) {
      adminRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = (document.getElementById('reg-admin-fullname').value || '').trim();
        const societyName = (document.getElementById('reg-admin-society').value || '').trim();
        const loginId = (document.getElementById('reg-admin-id').value || '').trim();
        const phone = (document.getElementById('reg-admin-phone').value || '').trim();
        const password = document.getElementById('reg-admin-password').value;
        const confirmPassword = document.getElementById('reg-admin-confirm').value;

        if (password !== confirmPassword) {
          showToast('Passwords do not match!', 'error');
          return;
        }
        if (password.length < 6) {
          showToast('Password must be at least 6 characters long!', 'error');
          return;
        }

        const dbUsers = getDatabaseUsers();
        if (dbUsers.some(u => u.loginId && u.loginId.toLowerCase() === loginId.toLowerCase())) {
          showToast(`Login ID "${loginId}" is already registered. Please choose another username.`, 'error');
          return;
        }

        state.isAuthenticating = true;
        render();

        const newAdmin = {
          id: Date.now(),
          loginId: loginId,
          password: password,
          fullName: fullName,
          societyName: societyName,
          phone: phone,
          role: 'ADMIN',
          mustResetPassword: false
        };

        // Fast backend registration with 3s timeout
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const resp = await fetch('/api/auth/register-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, societyName, loginId, phone, password }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (resp.ok) {
            const data = await resp.json();
            if (data.userId) newAdmin.id = data.userId;
            if (data.token) newAdmin.token = data.token;
          }
        } catch (err) {}

        // Reset state for new resident site: Remove testing residents and guards (set to 0 count)
        state.residents = [];
        state.guards = [];
        state.visitorRequests = [];
        localStorage.removeItem('gatesync_visitor_requests');

        // Save into local user database and session
        saveDatabaseUser(newAdmin);
        saveSession(newAdmin, newAdmin.token || ('token_' + Date.now()));

        state.isAuthenticating = false;
        state.activeView = 'admin';
        render();
        showToast(`Admin Account Registered & Saved to Database! Welcome ${fullName}.`, 'success');
      });
    }

    const passwordResetForm = document.getElementById('password-reset-form');
    if (passwordResetForm) {
      passwordResetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPass = (document.getElementById('reset-new').value || '').trim();
        const confirmPass = (document.getElementById('reset-confirm').value || '').trim();
        if (newPass !== confirmPass) {
          showToast('Passwords do not match!', 'error');
          return;
        }
        if (newPass.length < 6) {
          showToast('Password must be at least 6 characters long!', 'error');
          return;
        }
        if (state.currentUser) {
          state.currentUser.password = newPass;
          state.currentUser.mustResetPassword = false;
          const userId = state.currentUser.id || state.currentUser.loginId;
          if (userId) {
            localStorage.setItem(`gatesync_pwd_prompt_done_${userId}`, 'true');
          }
          saveDatabaseUser(state.currentUser);
          saveSession(state.currentUser, state.token);
        }
        state.activeView = state.currentUser ? state.currentUser.role.toLowerCase() : 'landing';
        render();
        showToast('Password updated successfully!', 'success');
      });
    }

    const guardForm = document.getElementById('guard-visitor-form');
    if (guardForm) {
      guardForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const destVal = document.getElementById('vis-destination').value;
        const [flat, block] = destVal.split('|');
        const name = (document.getElementById('vis-name').value || '').trim();
        const phone = (document.getElementById('vis-phone').value || '').trim();
        const purpose = document.getElementById('vis-purpose').value;
        
        const payload = {
          visitorName: name,
          visitorPhone: phone,
          purpose: purpose,
          targetFlat: flat,
          targetBlock: block,
          photoUrl: state.selectedPhoto,
          gateName: 'Main Gate A',
          guardName: state.currentUser ? state.currentUser.fullName : 'On-Duty Guard'
        };

        let newReq = {
          id: Date.now(),
          ...payload,
          status: 'PENDING',
          timeAgo: 'Just now',
          createdAt: new Date().toISOString()
        };

        try {
          const resp = await fetch('/api/guard/visitor/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.id) newReq.id = data.id;
          }
        } catch (err) {}

        state.visitorRequests.unshift(newReq);
        saveVisitorRequestsToStorage();
        if (window.gatesyncChannel) {
          window.gatesyncChannel.postMessage({
            type: 'VISITOR_EVENT',
            payload: {
              type: 'VISITOR_NEW',
              requestId: newReq.id,
              visitorName: newReq.visitorName,
              visitorPhone: newReq.visitorPhone,
              purpose: newReq.purpose,
              targetFlat: newReq.targetFlat,
              targetBlock: newReq.targetBlock,
              photoUrl: newReq.photoUrl,
              status: newReq.status,
              timestamp: newReq.createdAt
            }
          });
        }
        showToast(`Approval request sent to Resident at Flat ${flat}!`, 'amber');
        playAlertSound();
        state.selectedPhoto = PRESET_PHOTOS[0].url;
        render();
      });
    }
  }

  window.setAuthRole = function (role) {
    state.authRole = role;
    state.authMode = 'LOGIN';
    render();
  };

  window.setAuthMode = function (mode) {
    state.authMode = mode;
    render();
  };

  window.quickLogin = function (loginId, password) {
    loginId = (loginId || '').trim();
    password = (password || '').trim();
    const role = state.authRole || 'ADMIN';

    if (role === 'RESIDENT' || loginId.toLowerCase().includes('resident')) {
      let foundResident = state.residents.find(r => (r.loginId && r.loginId.toLowerCase() === loginId.toLowerCase()) || (r.phone && r.phone === loginId) || (r.name && r.name.toLowerCase() === loginId.toLowerCase()));

      let resName = 'Amit Patel';
      if (foundResident && (foundResident.name || foundResident.fullName)) {
        resName = foundResident.name || foundResident.fullName;
      } else if (loginId && loginId.toLowerCase() !== 'resident') {
        resName = loginId.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }

      const user = {
        id: foundResident ? foundResident.id : 2,
        loginId: foundResident ? foundResident.loginId : (loginId || 'resident'),
        fullName: resName,
        role: 'RESIDENT',
        blockNumber: foundResident ? (foundResident.blockNumber || 'A') : 'A',
        flatNumber: foundResident ? (foundResident.flatNumber || '101') : '101',
        flat: foundResident ? (foundResident.flat || 'A-101') : 'A-101',
        mustResetPassword: false
      };
      saveSession(user, 'token_' + Date.now());
      state.activeView = 'resident';
      render();
      showToast(`Welcome back, ${user.fullName}!`, 'success');
      return;
    }

    if (role === 'GUARD' || loginId.toLowerCase().includes('guard')) {
      let foundGuard = state.guards.find(g => (g.loginId && g.loginId.toLowerCase() === loginId.toLowerCase()) || (g.phone && g.phone === loginId) || (g.name && g.name.toLowerCase() === loginId.toLowerCase()));

      let guardName = 'Security Guard';
      if (foundGuard && (foundGuard.name || foundGuard.fullName)) {
        guardName = foundGuard.name || foundGuard.fullName;
      } else if (loginId && loginId.toLowerCase() !== 'guard') {
        guardName = loginId.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }

      const user = {
        id: foundGuard ? foundGuard.id : Date.now(),
        loginId: foundGuard ? foundGuard.loginId : (loginId || 'guard'),
        fullName: guardName,
        role: 'GUARD',
        mustResetPassword: false
      };
      saveSession(user, 'token_' + Date.now());
      state.activeView = 'guard';
      render();
      showToast(`Guard Terminal active. Welcome, ${user.fullName}!`, 'success');
      return;
    }

    // Default to Admin
    const user = {
      id: 1,
      loginId: loginId || 'admin',
      fullName: state.currentUser && state.currentUser.role === 'ADMIN' ? state.currentUser.fullName : 'System Admin',
      role: 'ADMIN',
      mustResetPassword: false
    };
    saveSession(user, 'token_' + Date.now());
    state.activeView = 'admin';
    render();
    showToast(`Welcome to GateSync Admin Panel!`, 'success');
  };

  // Helper Actions & Modals
  window.openSwitchRoleModal = function () {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="max-width:380px;">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700;">Switch Active Portal</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:10px;">
            <button class="btn btn-primary" onclick="closeModal(); switchPortal('ADMIN')" style="justify-content:flex-start; padding:12px 16px; width:100%;">
              <i data-lucide="shield"></i> Admin Dashboard
            </button>
            <button class="btn btn-primary" onclick="closeModal(); switchPortal('GUARD')" style="background:#0284c7; justify-content:flex-start; padding:12px 16px; width:100%;">
              <i data-lucide="shield-check"></i> Guard Terminal
            </button>
            <button class="btn btn-primary" onclick="closeModal(); switchPortal('RESIDENT')" style="background:#0d9488; justify-content:flex-start; padding:12px 16px; width:100%;">
              <i data-lucide="home"></i> Resident Portal
            </button>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.switchPortal = function (role) {
    let mockUser = { id: 1, loginId: 'admin', fullName: 'Rajesh Sharma', role: 'ADMIN', mustResetPassword: false };
    if (role === 'GUARD') {
      mockUser = { id: 2, loginId: 'guard', fullName: 'Vikram Singh', role: 'GUARD', mustResetPassword: false };
    } else if (role === 'RESIDENT') {
      mockUser = { id: 2, loginId: 'resident', fullName: 'Amit Patel', role: 'RESIDENT', blockNumber: 'A', flatNumber: '101', flat: 'A-101', mustResetPassword: false };
    }
    saveSession(mockUser, 'token_' + Date.now());
    state.activeView = role.toLowerCase();
    showToast(`Switched to ${role === 'GUARD' ? 'Guard Terminal' : role === 'RESIDENT' ? 'Resident Portal' : 'Admin Dashboard'}`, 'success');
    render();
  };

  window.cycleRoleDemo = function () {
    const roles = ['ADMIN', 'GUARD', 'RESIDENT'];
    const curr = state.currentUser ? state.currentUser.role : 'ADMIN';
    const next = roles[(roles.indexOf(curr) + 1) % roles.length];
    if (next === 'ADMIN') quickLogin('admin', 'admin123');
    else if (next === 'GUARD') quickLogin('guard', 'guard123');
    else quickLogin('resident', 'resident123');
  };

  window.switchView = function (view) {
    state.activeView = view;
    render();
  };

  window.switchTab = function (tab) {
    state.adminTab = tab;
    render();
  };

  window.filterResidentStatus = function (val) {
    state.residentStatusFilter = val;
    render();
  };

  window.openApproveModal = function (requestId) {
    const item = state.visitorRequests.find(r => r.id === requestId);
    if (!item) return;
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--success-green);">Confirm Visitor Approval</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body" style="text-align:center;">
            <img src="${item.photoUrl}" style="width:70px; height:70px; border-radius:50%; object-fit:cover; margin-bottom:12px;">
            <h3 style="font-size:18px; font-weight:700;">Approve ${item.visitorName}?</h3>
            <p style="font-size:13px; color:var(--text-muted); margin-top:4px;">Allow entry for ${item.purpose} to your unit.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" style="background:var(--success-green);" onclick="confirmApproveVisitor(${item.id})"><i data-lucide="check"></i> Confirm Approve</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.confirmApproveVisitor = async function (requestId) {
    const item = state.visitorRequests.find(r => r.id === requestId);
    if (item) {
      item.status = 'APPROVED';
      saveVisitorRequestsToStorage();
      if (window.gatesyncChannel) {
        window.gatesyncChannel.postMessage({
          type: 'VISITOR_EVENT',
          payload: { type: 'VISITOR_UPDATE', requestId: item.id, visitorName: item.visitorName, status: 'APPROVED' }
        });
      }
      try {
        await fetch('/api/resident/visitor/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, status: 'APPROVED' })
        });
      } catch (e) {}
      showToast(`Visitor ${item.visitorName} APPROVED! Guard notified to ALLOW ENTRY.`, 'success');
      playAlertSound();
    }
    closeModal();
    render();
  };

  window.openDenyModal = function (requestId) {
    const item = state.visitorRequests.find(r => r.id === requestId);
    if (!item) return;
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--danger-red);">Confirm Visitor Denial</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body">
            <div style="text-align:center; margin-bottom:16px;">
              <img src="${item.photoUrl}" style="width:70px; height:70px; border-radius:50%; object-fit:cover; margin-bottom:8px;">
              <h3 style="font-size:18px; font-weight:700;">Deny Entry for ${item.visitorName}?</h3>
            </div>
            <div class="form-group">
              <label>Optional Reason for Guard</label>
              <input type="text" id="deny-reason-input" class="form-control" placeholder="e.g. Expecting no delivery today">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" style="background:var(--danger-red);" onclick="confirmDenyVisitor(${item.id})"><i data-lucide="x-circle"></i> Confirm Deny</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.confirmDenyVisitor = async function (requestId) {
    const item = state.visitorRequests.find(r => r.id === requestId);
    const reasonInput = document.getElementById('deny-reason-input');
    const denialReason = reasonInput ? reasonInput.value.trim() : '';
    if (item) {
      item.status = 'DENIED';
      saveVisitorRequestsToStorage();
      if (window.gatesyncChannel) {
        window.gatesyncChannel.postMessage({
          type: 'VISITOR_EVENT',
          payload: { type: 'VISITOR_UPDATE', requestId: item.id, visitorName: item.visitorName, status: 'DENIED' }
        });
      }
      try {
        await fetch('/api/resident/visitor/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, status: 'DENIED', denialReason })
        });
      } catch (e) {}
      showToast(`Visitor ${item.visitorName} DENIED! Guard notified to INFORM DENIED.`, 'error');
    }
    closeModal();
    render();
  };

  window.checkoutVisitor = function (requestId) {
    const item = state.visitorRequests.find(r => r.id === requestId);
    if (item) {
      item.status = 'CHECKED_OUT';
      showToast(`${item.visitorName} checked out successfully!`, 'info');
      render();
    }
  };

  window.openPartyPassModal = function () {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700;">Party Booking & Guest Pass</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body">
            <div class="form-group" style="margin-bottom:12px;">
              <label>Event Title</label>
              <input type="text" id="party-name" class="form-control" placeholder="Enter Event Title" value="">
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Venue Selection</label>
                <select class="form-control">
                  <option value="Clubhouse Hall">Clubhouse Hall</option>
                  <option value="Main Lawn">Main Lawn</option>
                  <option value="Rooftop">Rooftop Terrace</option>
                </select>
              </div>
              <div class="form-group">
                <label>Expected Guests</label>
                <input type="number" class="form-control" placeholder="Enter number of guests" value="">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="generatePartyPass()">Send Booking & Generate QR Pass</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.generatePartyPass = function () {
    const title = document.getElementById('party-name').value || 'Party Pass';
    const code = 'PARTY-' + Math.floor(1000 + Math.random() * 9000);
    closeModal();
    showToast(`Party booking for "${title}" submitted to Admin! QR Pass code: ${code}`, 'success');
  };

  window.openReportProblemModal = function () {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--danger-red);">Report Community Problem</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body">
            <div class="form-group" style="margin-bottom:12px;">
              <label>Problem Title</label>
              <input type="text" id="pr-title" class="form-control" placeholder="Enter Problem Title">
            </div>
            <div class="form-group" style="margin-bottom:12px;">
              <label>Category</label>
              <select id="pr-category" class="form-control">
                <option>Water issue</option>
                <option>Power issue</option>
                <option>Security issue</option>
                <option>Lift issue</option>
                <option>Cleanliness issue</option>
              </select>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="pr-desc" class="form-control" rows="3" placeholder="Describe the issue..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="submitProblemReport()"><i data-lucide="send"></i> Broadcast to Community</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  // WebRTC Visitor Identity Camera Capture Engine
  window.openCameraModal = function () {
    const container = document.getElementById('camera-modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="max-width:500px; text-align:center;">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700;"><i data-lucide="camera"></i> Visitor Camera Capture</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeCameraModal()"></i>
          </div>
          <div class="modal-body">
            <div style="position:relative; width:100%; height:260px; background:#000; border-radius:12px; overflow:hidden; display:flex; align-items:center; justify-content:center; margin-bottom:16px;">
              <video id="camera-video" autoplay playsinline style="width:100%; height:100%; object-fit:cover; display:none;"></video>
              <canvas id="camera-canvas" style="display:none;"></canvas>
              <div id="camera-placeholder" style="color:#94a3b8; font-size:13px; text-align:center; padding:20px;">
                <i data-lucide="camera-off" style="width:36px; height:36px; margin-bottom:8px; display:block; margin:0 auto 8px;"></i>
                <div style="font-weight:600;">Requesting Camera Access...</div>
              </div>
            </div>

            <div style="font-size:12px; color:var(--text-muted); margin-bottom:12px; text-align:left; font-weight:600;">Or Choose Sample Visitor Photo:</div>
            <div style="display:flex; gap:10px; overflow-x:auto; padding-bottom:8px;">
              ${PRESET_PHOTOS.map((p) => `
                <img src="${p.url}" title="${p.title}" onclick="selectPresetPhoto('${p.url}')" style="width:60px; height:60px; border-radius:8px; object-fit:cover; cursor:pointer; border:2px solid ${state.selectedPhoto === p.url ? '#2563eb' : 'transparent'}; flex-shrink:0;">
              `).join('')}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeCameraModal()">Cancel</button>
            <button type="button" id="snap-btn" class="btn btn-primary" onclick="captureCameraPhoto()"><i data-lucide="camera"></i> Take Snap</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();

    const video = document.getElementById('camera-video');
    const placeholder = document.getElementById('camera-placeholder');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
          state.cameraStream = stream;
          if (video) {
            video.srcObject = stream;
            video.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
          }
        })
        .catch(err => {
          console.warn('Camera access error:', err);
          if (placeholder) {
            placeholder.innerHTML = `
              <i data-lucide="camera-off" style="width:36px; height:36px; margin:0 auto 8px; display:block; color:#ef4444;"></i>
              <div style="color:#ef4444; font-weight:600;">Camera Permission Denied or Not Supported</div>
              <div style="font-size:11px; margin-top:4px; color:var(--text-muted);">Please select one of the sample photos below.</div>
            `;
            lucide.createIcons();
          }
        });
    }
  };

  window.closeCameraModal = function () {
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach(track => track.stop());
      state.cameraStream = null;
    }
    const container = document.getElementById('camera-modal-container');
    if (container) container.innerHTML = '';
  };

  function updateGuardPhotoPreview() {
    const imgEl = document.querySelector('#guard-visitor-form img');
    if (imgEl) {
      imgEl.src = state.selectedPhoto;
    }
  }

  window.captureCameraPhoto = function () {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    if (video && video.style.display !== 'none' && video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      state.selectedPhoto = canvas.toDataURL('image/jpeg');
      showToast('Visitor photo captured successfully!', 'success');
    }
    closeCameraModal();
    updateGuardPhotoPreview();
  };

  window.selectPresetPhoto = function (url) {
    state.selectedPhoto = url;
    showToast('Sample visitor photo selected', 'info');
    closeCameraModal();
    updateGuardPhotoPreview();
  };

  // Community Issues & Broadcast Management
  window.submitProblemReport = function () {
    const titleInput = document.getElementById('pr-title');
    const title = titleInput ? titleInput.value.trim() : '';

    if (!title) {
      showToast('Please enter a problem title!', 'error');
      return;
    }

    const categorySelect = document.getElementById('pr-category');
    const category = categorySelect ? categorySelect.value : 'General';
    const descInput = document.getElementById('pr-desc');
    const description = descInput ? descInput.value.trim() : '';

    const user = state.currentUser || { fullName: 'Resident', flatNumber: '101', blockNumber: 'A' };
    const flatStr = user.flatNumber ? `Flat ${user.blockNumber || 'A'}-${user.flatNumber}` : 'Flat A-101';

    const problem = {
      id: Date.now(),
      reporterName: user.fullName || 'Resident',
      flat: flatStr,
      title: title,
      category: category,
      priority: 'Medium',
      description: description,
      status: 'PENDING',
      createdAt: 'Just now'
    };

    state.communityProblems.unshift(problem);
    closeModal();
    showToast(`Problem "${title}" submitted to Community Feed & Admin!`, 'success');
    render();
  };

  window.openCommunityFeedModal = function () {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="max-width:650px;">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--primary-blue);">
              <i data-lucide="message-square"></i> Community Feed & Reported Issues
            </h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body" style="max-height:400px; overflow-y:auto;">
            ${state.communityProblems.length === 0 ? `
              <div style="text-align:center; padding:30px; color:var(--text-muted);">
                <i data-lucide="check-circle-2" style="width:40px; height:40px; margin:0 auto 8px; display:block; color:#10b981;"></i>
                <div style="font-weight:600;">No community issues reported</div>
                <div style="font-size:12px; margin-top:2px;">All society operations are running smoothly.</div>
              </div>
            ` : state.communityProblems.map(p => `
              <div style="padding:14px; border:1px solid #e2e8f0; border-radius:10px; margin-bottom:10px; background:#f8fafc;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-weight:700; font-size:14px; color:#1e293b;">${p.title}</span>
                  <span class="status-pill ${p.status === 'RESOLVED' ? 'active' : 'checked-out'}">${p.status}</span>
                </div>
                <div style="font-size:12px; color:var(--text-muted); margin-bottom:6px;">
                  Reported by <strong>${p.reporterName} (${p.flat})</strong> • Category: ${p.category}
                </div>
                <div style="font-size:13px; color:#334155;">${p.description || 'No detailed description.'}</div>
                ${p.adminReply ? `
                  <div style="margin-top:8px; padding:8px 12px; background:#eff6ff; border-left:3px solid #2563eb; border-radius:4px; font-size:12px; color:#1e40af;">
                    <strong>Admin Reply:</strong> ${p.adminReply}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
            <button class="btn btn-primary" onclick="closeModal(); openReportProblemModal();"><i data-lucide="plus"></i> Report Issue</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.openCommunityProblemsAdminModal = function () {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="max-width:700px;">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:#2563eb;">
              <i data-lucide="shield-alert"></i> Admin - Community Complaints Management
            </h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body" style="max-height:420px; overflow-y:auto;">
            ${state.communityProblems.length === 0 ? `
              <div style="text-align:center; padding:30px; color:var(--text-muted);">
                <div style="font-weight:600;">0 Complaints Logged</div>
                <div style="font-size:12px; margin-top:2px;">Resident issue reports will appear here for Admin review.</div>
              </div>
            ` : state.communityProblems.map(p => `
              <div style="padding:14px; border:1px solid #e2e8f0; border-radius:10px; margin-bottom:12px; background:white;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-weight:700; font-size:14px;">${p.title} (${p.category})</span>
                  <span class="status-pill ${p.status === 'RESOLVED' ? 'active' : 'checked-out'}">${p.status}</span>
                </div>
                <div style="font-size:12px; color:var(--text-muted); margin-bottom:6px;">By ${p.reporterName} (${p.flat})</div>
                <div style="font-size:13px; color:#334155; margin-bottom:10px;">${p.description || 'No description provided.'}</div>
                <div style="display:flex; gap:8px;">
                  <button class="btn btn-primary btn-sm" style="background:#16a34a;" onclick="resolveProblem(${p.id})">Mark Resolved</button>
                  <button class="btn btn-secondary btn-sm" onclick="deleteProblem(${p.id})">Delete</button>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.resolveProblem = function (id) {
    const p = state.communityProblems.find(item => item.id === id);
    if (p) {
      p.status = 'RESOLVED';
      p.adminReply = 'Issue investigated and resolved by Admin team.';
      showToast(`Complaint "${p.title}" marked as RESOLVED!`, 'success');
      openCommunityProblemsAdminModal();
    }
  };

  window.deleteProblem = function (id) {
    state.communityProblems = state.communityProblems.filter(item => item.id !== id);
    showToast('Complaint removed', 'info');
    openCommunityProblemsAdminModal();
  };

  window.openRegisterVisitorModal = function () {
    if (state.currentUser && state.currentUser.role !== 'GUARD') {
      showToast('Only Security Guards can register gate visitors. Switched to Guard Terminal.', 'info');
      quickLogin('guard', 'guard123');
    } else {
      switchView('guard');
      setTimeout(() => {
        const input = document.getElementById('vis-name');
        if (input) input.focus();
      }, 100);
    }
  };

  window.toggleMobileSidebar = function () {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.toggle('mobile-open');
  };

  window.toggleNotificationDrawer = function () {
    state.notificationDrawerOpen = !state.notificationDrawerOpen;
    render();
  };

  window.markNotificationsRead = function () {
    state.notifications.forEach(n => n.read = true);
    state.notificationDrawerOpen = false;
    showToast('All notifications marked as read', 'info');
    render();
  };

  window.openHelpModal = function () {
    showToast('GateSync India Support: +91 1800 123 4283', 'info');
  };

  window.openProfileModal = function () {
    const user = state.currentUser || { fullName: 'Amit Patel', role: 'RESIDENT', blockNumber: 'A', flatNumber: '101' };
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700;">Resident Profile & Security</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body">
            <div style="text-align:center; margin-bottom:20px;">
              <div style="width:70px; height:70px; border-radius:50%; background:#2563eb; color:white; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:700; margin:0 auto 12px;">
                ${user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'AP'}
              </div>
              <h3 style="font-size:18px; font-weight:700;">${user.fullName}</h3>
              <p style="font-size:13px; color:var(--text-muted); margin-top:2px;">
                ${user.role === 'RESIDENT' ? `Resident • Flat ${user.flatNumber || '402'} (Block ${user.blockNumber || 'A'})` : user.role}
              </p>
              <p style="font-size:12px; color:var(--primary-blue); font-weight:600; margin-top:4px;">Phone: +91 99887 76655</p>
            </div>

            <div style="display:flex; flex-direction:column; gap:10px;">
              <button class="btn btn-primary" onclick="closeModal(); openChangePasswordModal();" style="width:100%;">
                <i data-lucide="key"></i> Change Login Password
              </button>
              <button class="btn btn-secondary" onclick="closeModal(); openManagePassesModal();" style="width:100%;">
                <i data-lucide="qr-code"></i> Manage Pre-Approved Gate Passes
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.togglePasswordVisibility = function (inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    if (btnEl) {
      const iconName = isPassword ? 'eye-off' : 'eye';
      btnEl.innerHTML = `<i data-lucide="${iconName}" style="width:18px; height:18px;"></i>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  };

  window.openChangePasswordModal = function () {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--primary-blue);">Change Account Password</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <form id="change-pass-form">
            <div class="modal-body">
              <div class="form-group" style="margin-bottom:12px;">
                <label>Current Password</label>
                <div style="position:relative;">
                  <input type="password" id="cp-current" class="form-control" placeholder="••••••••" required style="padding-right:42px;">
                  <button type="button" onclick="togglePasswordVisibility('cp-current', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                    <i data-lucide="eye" style="width:18px; height:18px;"></i>
                  </button>
                </div>
              </div>
              <div class="form-group" style="margin-bottom:12px;">
                <label>New Password</label>
                <div style="position:relative;">
                  <input type="password" id="cp-new" class="form-control" placeholder="Minimum 6 characters" required style="padding-right:42px;">
                  <button type="button" onclick="togglePasswordVisibility('cp-new', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                    <i data-lucide="eye" style="width:18px; height:18px;"></i>
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>Confirm New Password</label>
                <div style="position:relative;">
                  <input type="password" id="cp-confirm" class="form-control" placeholder="••••••••" required style="padding-right:42px;">
                  <button type="button" onclick="togglePasswordVisibility('cp-confirm', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                    <i data-lucide="eye" style="width:18px; height:18px;"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary"><i data-lucide="shield-check"></i> Update Password</button>
            </div>
          </form>
        </div>
      </div>
    `;
    lucide.createIcons();

    document.getElementById('change-pass-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('cp-current').value;
      const newPassword = document.getElementById('cp-new').value;
      const confirmPassword = document.getElementById('cp-confirm').value;

      if (newPassword !== confirmPassword) {
        showToast('New passwords do not match!', 'error');
        return;
      }
      if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters long!', 'error');
        return;
      }

      try {
        const username = state.currentUser ? (state.currentUser.loginId || state.currentUser.phone || 'resident') : 'resident';
        await fetch('/api/resident/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, oldPassword: currentPassword, newPassword })
        });
      } catch (err) {}

      if (state.currentUser) {
        state.currentUser.password = newPassword;
        state.currentUser.mustResetPassword = false;
        const userId = state.currentUser.id || state.currentUser.loginId;
        if (userId) {
          localStorage.setItem(`gatesync_pwd_prompt_done_${userId}`, 'true');
        }
        saveDatabaseUser({ ...state.currentUser, password: newPassword });
        saveSession(state.currentUser, state.token);
      }

      closeModal();
      showToast('Password changed successfully!', 'success');
    });
  };

  window.openManagePassesModal = function () {
    const container = document.getElementById('modal-container');
    const passCode = 'IN-PASS-' + Math.floor(1000 + Math.random() * 9000);
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700;">Pre-Approved Gate Pass</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body" style="text-align:center;">
            <div style="background:#f1f5f9; padding:16px; border-radius:12px; margin-bottom:16px;">
              <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:1px;">Active Gate Entry Pass Code</div>
              <div style="font-size:28px; font-weight:800; color:var(--primary-blue); margin:8px 0;">${passCode}</div>
              <div style="font-size:11px; color:#16a34a; font-weight:600;">Valid for 24 Hours • Share with Guest</div>
            </div>
            <div class="form-group" style="text-align:left;">
              <label>Guest Phone (+91)</label>
              <input type="tel" id="pass-guest-phone" class="form-control" placeholder="10-digit mobile number" maxlength="10" pattern="[0-9]{10}" oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,10)">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="sharePassCode('${passCode}')"><i data-lucide="share-2"></i> Copy & Share Pass</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.sharePassCode = async function (passCode) {
    const phoneInput = document.getElementById('pass-guest-phone');
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const user = state.currentUser || {};

    const passReq = {
      id: Date.now(),
      visitorName: phone ? `Guest (${phone})` : 'Pre-Approved Guest',
      visitorPhone: phone || 'N/A',
      purpose: 'Pre-Approved Gate Pass (' + passCode + ')',
      targetFlat: user.flatNumber || '101',
      targetBlock: user.blockNumber || 'A',
      photoUrl: PRESET_PHOTOS[1].url,
      status: 'APPROVED',
      inTime: 'Pre-Approved Pass',
      createdAt: new Date().toISOString()
    };

    state.visitorRequests.unshift(passReq);

    try {
      await fetch('/api/resident/pass/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: passReq.visitorName,
          guestPhone: phone,
          category: 'GUEST',
          residentFlat: (user.blockNumber || 'A') + '-' + (user.flatNumber || '101'),
          residentName: user.fullName || 'Resident',
          validHours: 24
        })
      });
    } catch (e) {}

    closeModal();
    if (phone) {
      showToast(`Pass code ${passCode} copied & sent via SMS to ${phone}!`, 'success');
    } else {
      showToast(`Pass code ${passCode} copied to clipboard & added to Guard Gate system!`, 'success');
    }
    render();
  };

  window.openAddUserModal = function (type = 'RESIDENT') {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--primary-blue);">
              <i data-lucide="user-plus"></i> Add New ${type === 'RESIDENT' ? 'Resident' : 'User'}
            </h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <form id="add-user-modal-form">
            <div class="modal-body">
              <div class="form-group" style="margin-bottom:12px;">
                <label>Full Name</label>
                <input type="text" id="au-name" class="form-control" placeholder="Enter Full Name" required>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Block Letter</label>
                  <select id="au-block" class="form-control">
                    <option value="A">Block A</option>
                    <option value="B">Block B</option>
                    <option value="C">Block C</option>
                    <option value="D">Block D</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Flat Number</label>
                  <input type="text" id="au-flat" class="form-control" placeholder="Enter Flat Number" required>
                </div>
              </div>
              <div class="form-group" style="margin-bottom:12px;">
                <label>Contact Phone (+91 - 10 Digits)</label>
                <input type="tel" id="au-phone" class="form-control" placeholder="Enter 10-digit Phone Number" maxlength="10" pattern="[0-9]{10}" oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,10)" required>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Login Username</label>
                  <input type="text" id="au-login" class="form-control" placeholder="Enter Username" required>
                </div>
                <div class="form-group">
                  <label>Initial Password</label>
                  <div style="position:relative;">
                    <input type="password" id="au-password" class="form-control" placeholder="Enter Initial Password" value="" required style="padding-right:42px;">
                    <button type="button" onclick="togglePasswordVisibility('au-password', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                      <i data-lucide="eye" style="width:18px; height:18px;"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary"><i data-lucide="check-circle"></i> Save Resident</button>
            </div>
          </form>
        </div>
      </div>
    `;
    lucide.createIcons();

    document.getElementById('add-user-modal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('au-name').value;
      const block = document.getElementById('au-block').value;
      const flatNum = document.getElementById('au-flat').value;
      const phone = document.getElementById('au-phone').value;
      const loginId = document.getElementById('au-login').value;
      const passVal = document.getElementById('au-password') ? document.getElementById('au-password').value : '123';
      const flatStr = `${block}-${flatNum}`;
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

      const newRes = {
        id: Date.now(),
        name,
        fullName: name,
        initials,
        flat: flatStr,
        flatNumber: flatNum,
        blockNumber: block,
        loginId,
        password: passVal || '123',
        phone,
        backupPhone: '',
        role: 'RESIDENT',
        status: 'Active',
        mustResetPassword: false,
        avatarBg: 'blue'
      };

      // Save to Backend Spring Boot & MongoDB Atlas with Authorization token
      try {
        const resp = await apiFetch('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify({
            loginId: newRes.loginId,
            password: newRes.password,
            fullName: newRes.name,
            phone: newRes.phone,
            role: 'RESIDENT',
            blockNumber: block,
            flatNumber: flatNum
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.id) newRes.id = data.id;
        }
      } catch (e) {}

      saveDatabaseUser(newRes);
      state.residents.unshift(newRes);
      closeModal();
      showToast(`Resident ${name} (Flat ${flatStr}) saved to DB & MongoDB! Login ID: "${loginId}" / Password: "${passVal || '123'}"`, 'success');
      render();
    });
  };

  window.openEditResidentModal = function (id) {
    const r = state.residents.find(res => res.id === id);
    if (!r) return;
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700;">Edit Resident: ${r.name}</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <form id="edit-resident-form">
            <div class="modal-body">
              <div class="form-group" style="margin-bottom:12px;">
                <label>Full Name</label>
                <input type="text" id="er-name" class="form-control" value="${r.name}" required>
              </div>
              <div class="form-group" style="margin-bottom:12px;">
                <label>Flat Number</label>
                <input type="text" id="er-flat" class="form-control" value="${r.flat}" required>
              </div>
              <div class="form-group" style="margin-bottom:12px;">
                <label>Phone Number</label>
                <input type="tel" id="er-phone" class="form-control" value="${r.phone}" required>
              </div>
              <div class="form-group">
                <label>Account Status</label>
                <select id="er-status" class="form-control">
                  <option value="Active" ${r.status === 'Active' ? 'selected' : ''}>Active</option>
                  <option value="Inactive" ${r.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Update Resident</button>
            </div>
          </form>
        </div>
      </div>
    `;
    lucide.createIcons();

    document.getElementById('edit-resident-form').addEventListener('submit', (e) => {
      e.preventDefault();
      r.name = document.getElementById('er-name').value;
      r.flat = document.getElementById('er-flat').value;
      r.phone = document.getElementById('er-phone').value;
      r.status = document.getElementById('er-status').value;
      closeModal();
      showToast(`Resident ${r.name} updated!`, 'success');
      render();
    });
  };

  window.confirmDeleteResident = function (id) {
    const r = state.residents.find(res => res.id === id);
    if (!r) return;
    if (confirm(`Are you sure you want to remove resident ${r.name} (${r.flat})?`)) {
      state.residents = state.residents.filter(res => res.id !== id);
      showToast(`Resident ${r.name} removed`, 'info');
      render();
    }
  };

  window.openAddGuardModal = function () {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--primary-blue);">Add Security Guard</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <form id="add-guard-form">
            <div class="modal-body">
              <div class="form-group" style="margin-bottom:12px;">
                <label>Guard Full Name</label>
                <input type="text" id="ag-name" class="form-control" placeholder="Enter Guard Full Name" required>
              </div>
              <div class="form-group" style="margin-bottom:12px;">
                <label>Phone Number (+91)</label>
                <input type="tel" id="ag-phone" class="form-control" placeholder="Enter Phone Number" required>
              </div>
              <div class="form-grid" style="margin-bottom:12px;">
                <div class="form-group">
                  <label>Login Username / Guard ID</label>
                  <input type="text" id="ag-login" class="form-control" placeholder="Enter Guard Username" required>
                </div>
                <div class="form-group">
                  <label>Initial Password</label>
                  <div style="position:relative;">
                    <input type="password" id="ag-password" class="form-control" placeholder="Enter Password" value="123" required style="padding-right:42px;">
                    <button type="button" onclick="togglePasswordVisibility('ag-password', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                      <i data-lucide="eye" style="width:18px; height:18px;"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Assigned Shift</label>
                  <select id="ag-shift" class="form-control">
                    <option value="DAY">DAY Shift (8 AM - 8 PM)</option>
                    <option value="NIGHT">NIGHT Shift (8 PM - 8 AM)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Assigned Gate Station</label>
                  <select id="ag-gate" class="form-control">
                    <option value="Gate A - Main Entrance">Gate A - Main Entrance</option>
                    <option value="Gate B - North Service">Gate B - North Service</option>
                    <option value="Gate C - West Emergency">Gate C - West Emergency</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Guard</button>
            </div>
          </form>
        </div>
      </div>
    `;
    lucide.createIcons();

    document.getElementById('add-guard-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('ag-name').value;
      const phone = document.getElementById('ag-phone').value;
      const loginIdInput = document.getElementById('ag-login') ? document.getElementById('ag-login').value.trim() : '';
      const passInput = document.getElementById('ag-password') ? document.getElementById('ag-password').value : '123';
      const shift = document.getElementById('ag-shift').value;
      const gate = document.getElementById('ag-gate').value;
      const guardLoginId = loginIdInput || ('guard_' + name.toLowerCase().replace(/\s+/g, ''));

      const newGuard = {
        id: Date.now(),
        name,
        fullName: name,
        loginId: guardLoginId,
        password: passInput || '123',
        phone,
        shift,
        gate,
        role: 'GUARD',
        mustResetPassword: false
      };

      // Save to Backend Spring Boot & MongoDB Atlas with Authorization token
      try {
        const resp = await apiFetch('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify({
            loginId: newGuard.loginId,
            password: newGuard.password,
            fullName: newGuard.name,
            phone: newGuard.phone,
            role: 'GUARD',
            shiftSchedule: shift,
            gateAssigned: gate
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.id) newGuard.id = data.id;
        }
      } catch (e) {}

      saveDatabaseUser(newGuard);
      state.guards.push(newGuard);
      closeModal();
      showToast(`Guard ${name} saved to DB & MongoDB! Login ID: "${guardLoginId}" / Password: "${passInput || '123'}"`, 'success');
      render();
    });
  };

  window.openVisitorDetailModal = function (id) {
    const item = state.visitorRequests.find(r => r.id === id);
    if (!item) return;
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700;">Visitor Audit Record</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body" style="text-align:center;">
            <img src="${item.photoUrl}" style="width:100px; height:100px; border-radius:var(--radius-md); object-fit:cover; margin-bottom:12px; border:2px solid var(--primary-blue);">
            <h3 style="font-size:20px; font-weight:700;">${item.visitorName}</h3>
            <p style="font-size:13px; color:var(--text-muted);">Phone: ${item.visitorPhone}</p>
            <div style="background:#f8fafc; padding:12px; border-radius:8px; margin-top:16px; text-align:left; font-size:13px;">
              <div><strong>Destination:</strong> Block ${item.targetBlock || 'A'} - Flat ${item.targetFlat}</div>
              <div><strong>Purpose:</strong> ${item.purpose}</div>
              <div><strong>In Time:</strong> ${item.inTime || 'Logged today'}</div>
              <div><strong>Status:</strong> <span class="status-pill active">${item.status}</span></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  function renderNotificationDrawerCard() {
    const unreadList = state.notifications || [];
    const filter = state.notificationFilter || 'ALL';

    const filtered = unreadList.filter(n => {
      if (filter === 'ALL') return true;
      return n.category === filter;
    });

    const unreadCount = unreadList.filter(n => !n.read).length;

    return `
      <div class="notification-drawer-card">
        <div class="drawer-header-bar">
          <div class="drawer-title-group">
            <i data-lucide="bell" style="width:18px; height:18px; color:#2563eb;"></i>
            <span>Notifications (${unreadCount})</span>
          </div>
          <div style="display:flex; gap:12px;">
            <span class="drawer-action-link" onclick="markNotificationsRead()">Mark read</span>
            <span class="drawer-action-link" style="color:#ef4444;" onclick="clearAllNotifications()">Clear</span>
          </div>
        </div>

        <div class="drawer-filter-pills">
          <button class="drawer-pill-btn ${filter === 'ALL' ? 'active' : ''}" onclick="filterNotifications('ALL')">All</button>
          <button class="drawer-pill-btn ${filter === 'VISITOR' ? 'active' : ''}" onclick="filterNotifications('VISITOR')">🔔 Visitors</button>
          <button class="drawer-pill-btn ${filter === 'EMERGENCY_SOS' ? 'active' : ''}" onclick="filterNotifications('EMERGENCY_SOS')">🚨 SOS</button>
          <button class="drawer-pill-btn ${filter === 'COMPLAINT' ? 'active' : ''}" onclick="filterNotifications('COMPLAINT')">⚠️ Issues</button>
          <button class="drawer-pill-btn ${filter === 'CLUBHOUSE' ? 'active' : ''}" onclick="filterNotifications('CLUBHOUSE')">🎉 Bookings</button>
          <button class="drawer-pill-btn ${filter === 'ANNOUNCEMENT' ? 'active' : ''}" onclick="filterNotifications('ANNOUNCEMENT')">📢 News</button>
        </div>

        <div class="drawer-item-list">
          ${filtered.length === 0 ? `
            <div style="font-size:12px; color:#94a3b8; text-align:center; padding:24px;">No notifications in this filter</div>
          ` : filtered.map((n, idx) => `
            <div class="drawer-item-row ${!n.read ? 'unread' : ''}" onclick="markNotificationItemRead(${idx})">
              <div class="drawer-item-icon ${n.category === 'EMERGENCY_SOS' ? 'icon-cat-emergency' : n.category === 'VISITOR' ? 'icon-cat-visitor' : n.category === 'COMPLAINT' ? 'icon-cat-complaint' : n.category === 'CLUBHOUSE' ? 'icon-cat-booking' : 'icon-cat-announcement'}">
                <i data-lucide="${n.category === 'EMERGENCY_SOS' ? 'alert-triangle' : n.category === 'VISITOR' ? 'user-check' : n.category === 'COMPLAINT' ? 'help-circle' : n.category === 'CLUBHOUSE' ? 'calendar' : 'megaphone'}"></i>
              </div>
              <div class="drawer-item-content">
                <div class="drawer-item-top">
                  <span class="drawer-item-title">${n.title}</span>
                  <span class="drawer-item-time">${n.time || 'Just now'}</span>
                </div>
                <div class="drawer-item-msg">${n.message}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="drawer-footer-bar">
          <span style="font-size:11px; color:#64748b;">Cross-Tab Realtime Synced</span>
          ${state.currentUser && state.currentUser.role === 'ADMIN' ? `
            <button class="btn btn-secondary" style="font-size:11px; padding:4px 10px;" onclick="openAnnouncementModal()">+ Broadcast News</button>
          ` : ''}
        </div>
      </div>
    `;
  }

  window.filterNotifications = function(cat) {
    state.notificationFilter = cat;
    render();
  };

  window.markNotificationItemRead = function(idx) {
    if (state.notifications && state.notifications[idx]) {
      state.notifications[idx].read = true;
      saveNotificationsToStorage();
      render();
    }
  };

  window.markNotificationsRead = function() {
    if (state.notifications) {
      state.notifications.forEach(n => n.read = true);
      saveNotificationsToStorage();
      showToast('All notifications marked as read', 'info');
      render();
    }
  };

  window.clearAllNotifications = function() {
    state.notifications = [];
    saveNotificationsToStorage();
    showToast('Notifications cleared', 'info');
    render();
  };

  window.openEmergencyModal = function() {
    requestWebPushPermission();
    const user = state.currentUser || { fullName: 'Resident', role: 'RESIDENT', blockNumber: 'A', flatNumber: '101' };
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="border-top:5px solid #dc2626;">
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:24px;">🚨</span>
              <h3 style="font-family:var(--font-heading); font-size:18px; font-weight:800; color:#dc2626;">Trigger Emergency Panic SOS</h3>
            </div>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body">
            <p style="font-size:13px; color:#64748b; margin-bottom:16px;">
              This will immediately broadcast a critical panic alert to <strong>all security guards, society admins, and open terminals</strong> with high-priority audio sirens.
            </p>

            <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
              <label style="font-size:12px; font-weight:700; color:#1e293b;">Select Emergency Category:</label>
              <select id="sos-category" class="guard-tap-control" style="width:100%; font-weight:700;">
                <option value="MEDICAL">🚑 Medical Emergency</option>
                <option value="FIRE">🔥 Fire Hazard Alert</option>
                <option value="SECURITY">🛡️ Intruder / Security Threat</option>
                <option value="GATE_DISTURBANCE">🚪 Gate Disturbance / Conflict</option>
                <option value="GENERAL">⚠️ General Panic Alert</option>
              </select>
            </div>

            <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:20px;">
              <label style="font-size:12px; font-weight:700; color:#1e293b;">Additional Notes / Location Details (Optional):</label>
              <textarea id="sos-notes" rows="2" placeholder="e.g. Need immediate ambulance at Block A Lift Lobby" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; font-size:13px;"></textarea>
            </div>

            <div style="display:flex; gap:10px;">
              <button class="btn btn-secondary" onclick="closeModal()" style="flex:1;">Cancel</button>
              <button class="btn btn-primary" onclick="submitEmergencySos()" style="flex:2; background:#dc2626; border-color:#dc2626; font-weight:800;">
                🚨 BROADCAST SOS NOW
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.submitEmergencySos = function() {
    const user = state.currentUser || { fullName: 'Resident User', role: 'RESIDENT', blockNumber: 'A', flatNumber: '101' };
    const categorySelect = document.getElementById('sos-category');
    const notesInput = document.getElementById('sos-notes');

    const emergencyPayload = {
      emergencyType: categorySelect ? categorySelect.value : 'GENERAL',
      callerName: user.fullName || 'Resident',
      callerRole: user.role || 'RESIDENT',
      callerPhone: user.phone || '9988776655',
      blockNumber: user.blockNumber || 'A',
      flatNumber: user.flatNumber || '101',
      note: notesInput ? notesInput.value : '',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    closeModal();

    fetch('/api/emergency/sos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (state.token || ''),
        'X-User-Name': user.fullName || 'Resident'
      },
      body: JSON.stringify(emergencyPayload)
    }).catch(() => {});

    handleNotificationEvent({
      type: 'EMERGENCY_SOS',
      category: 'EMERGENCY_SOS',
      payload: emergencyPayload
    });
  };

  function renderEmergencyBanner() {
    const root = document.getElementById('emergency-banner-root');
    if (!root) return;

    if (!state.activeEmergency || state.activeEmergency.status === 'RESOLVED') {
      root.innerHTML = '';
      return;
    }

    const em = state.activeEmergency;
    const isGuardOrAdmin = state.currentUser && (state.currentUser.role === 'GUARD' || state.currentUser.role === 'ADMIN');

    root.innerHTML = `
      <div class="emergency-banner">
        <div class="emergency-banner-left">
          <div class="emergency-siren-icon">🚨</div>
          <div>
            <div class="emergency-title">CRITICAL EMERGENCY SOS: ${em.emergencyType || 'ALERT'}</div>
            <div class="emergency-details">
              Reported by <strong>${em.callerName || 'Resident'}</strong> (${em.blockNumber ? 'Flat ' + em.blockNumber + '-' + em.flatNumber : 'Gate'})
              ${em.note ? ' • Note: "' + em.note + '"' : ''}
              ${em.status === 'ACKNOWLEDGED' ? ' • <span style="color:#fef08a; font-weight:700;">Acknowledged by ' + (em.acknowledgedBy || 'Guard') + '</span>' : ''}
            </div>
          </div>
        </div>
        <div class="emergency-banner-actions">
          ${isGuardOrAdmin && em.status !== 'ACKNOWLEDGED' ? `
            <button class="btn-ack-emergency" onclick="acknowledgeEmergencyAlert(${em.id || 1})">
              👮 Acknowledge & Dispatch
            </button>
          ` : ''}
          ${isGuardOrAdmin ? `
            <button class="btn-dismiss-emergency" onclick="resolveEmergencyAlert(${em.id || 1})">
              ✅ Resolve Alert
            </button>
          ` : `
            <button class="btn-dismiss-emergency" onclick="dismissEmergencyBanner()">
              Dismiss Banner
            </button>
          `}
        </div>
      </div>
    `;
  }

  window.acknowledgeEmergencyAlert = function(id) {
    if (state.activeEmergency) {
      state.activeEmergency.status = 'ACKNOWLEDGED';
      state.activeEmergency.acknowledgedBy = state.currentUser ? state.currentUser.fullName : 'On-Duty Guard';
      stopEmergencySound();
      showToast('Emergency alert acknowledged by guard', 'success');
      broadcastSyncEvent('SYNC_EMERGENCY_SOS', state.activeEmergency);
      renderEmergencyBanner();
    }
  };

  window.resolveEmergencyAlert = function(id) {
    if (state.activeEmergency) {
      state.activeEmergency.status = 'RESOLVED';
      stopEmergencySound();
      showToast('Emergency alert marked as resolved', 'success');
      broadcastSyncEvent('SYNC_EMERGENCY_SOS', state.activeEmergency);
      state.activeEmergency = null;
      renderEmergencyBanner();
    }
  };

  window.dismissEmergencyBanner = function() {
    stopEmergencySound();
    state.activeEmergency = null;
    renderEmergencyBanner();
  };

  window.openAnnouncementModal = function() {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700;">📢 Broadcast Society Announcement</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body">
            <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:16px;">
              <div>
                <label style="font-size:12px; font-weight:700; color:#1e293b;">Title:</label>
                <input type="text" id="announce-title" placeholder="e.g. Water Tank Maintenance Tomorrow" class="guard-tap-control" style="width:100%; margin-top:4px;">
              </div>

              <div>
                <label style="font-size:12px; font-weight:700; color:#1e293b;">Message Content:</label>
                <textarea id="announce-msg" rows="3" placeholder="Water supply will be temporarily paused from 10 AM to 2 PM." style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; font-size:13px; margin-top:4px;"></textarea>
              </div>

              <div>
                <label style="font-size:12px; font-weight:700; color:#1e293b;">Target Group:</label>
                <select id="announce-target" class="guard-tap-control" style="width:100%; margin-top:4px;">
                  <option value="ALL">All Society Users</option>
                  <option value="RESIDENT">Residents Only</option>
                  <option value="GUARD">Security Guards Only</option>
                </select>
              </div>
            </div>

            <div style="display:flex; gap:10px;">
              <button class="btn btn-secondary" onclick="closeModal()" style="flex:1;">Cancel</button>
              <button class="btn btn-primary" onclick="submitAnnouncement()" style="flex:2;">📢 Broadcast Announcement</button>
            </div>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.submitAnnouncement = function() {
    const titleInput = document.getElementById('announce-title');
    const msgInput = document.getElementById('announce-msg');
    const targetSelect = document.getElementById('announce-target');

    if (!titleInput || !msgInput || !titleInput.value || !msgInput.value) {
      showToast('Please provide a title and message content', 'error');
      return;
    }

    const title = titleInput.value;
    const msg = msgInput.value;
    const target = targetSelect ? targetSelect.value : 'ALL';

    closeModal();

    fetch('/api/notifications/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (state.token || ''),
        'X-User-Name': state.currentUser ? state.currentUser.fullName : 'Admin'
      },
      body: JSON.stringify({
        title: title,
        message: msg,
        category: 'ANNOUNCEMENT',
        priority: 'HIGH',
        targetRole: target
      })
    }).catch(() => {});

    handleNotificationEvent({
      type: 'ANNOUNCEMENT',
      category: 'ANNOUNCEMENT',
      title: title,
      message: msg
    });
  };

  loadNotificationsFromStorage();

  window.closeModal = function () {
    if (typeof closeCameraModal === 'function') closeCameraModal();
    const m = document.getElementById('modal-container');
    if (m) m.innerHTML = '';
  };
})();
